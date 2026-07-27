import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockCreateArtifact, mockMarkReady, mockEmitRunEvent, mockGetRunHotState } =
  vi.hoisted(() => ({
    mockCreateArtifact: vi.fn(),
    mockMarkReady: vi.fn(),
    mockEmitRunEvent: vi.fn(),
    mockGetRunHotState: vi.fn(),
  }));

// Mock lib/hermes — the orchestrator singleton exposes artifactManager
vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    artifactManager: {
      createArtifact: mockCreateArtifact,
      markReady: mockMarkReady,
    },
  })),
}));

// Mock the streaming engine — the ChatStreamBridge uses it for Redis-backed
// event persistence (replay, hot state, sequence assignment).
vi.mock("@/lib/hermes/modules/streaming-engine", () => ({
  getHermesStreamingEngine: vi.fn(() => ({
    emitRunEvent: mockEmitRunEvent,
    getRunHotState: mockGetRunHotState,
  })),
}));

// Mock logger to suppress noise
vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks are set up)
// ---------------------------------------------------------------------------

import { getDocumentIngestionOrchestrator } from "@/lib/hermes/modules/document-ingestion-orchestrator";
import { ChatStreamBridge } from "@/lib/hermes/modules/chat-orchestrator/stream-bridge";
import type { SSEController } from "@/lib/hermes/modules/chat-orchestrator/stream-bridge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RUN_ID = "run_ingest_test_001";
const WORKSPACE_ID = "ws_ingest_test_001";
const SESSION_ID = "session_ingest_test_001";
const USER_ID = "user_ingest_test_001";
const ARTIFACT_ID = "art_ingest_test_001";

function createMockSSEController(): { sse: SSEController; chunks: Uint8Array[] } {
  const chunks: Uint8Array[] = [];
  const controller: ReadableStreamDefaultController<Uint8Array> = {
    enqueue: vi.fn((chunk: Uint8Array) => chunks.push(chunk)),
    close: vi.fn(),
    error: vi.fn(),
    desiredSize: null,
  };
  const encoder = new TextEncoder();
  return { sse: { controller, encoder }, chunks };
}

function decodeChunks(chunks: Uint8Array[]): any[] {
  const decoder = new TextDecoder();
  const fullText = chunks.map((c) => decoder.decode(c)).join("");
  const events: any[] = [];
  const lines = fullText.split("\n\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    try {
      events.push(JSON.parse(line.slice(6)));
    } catch {
      // skip malformed
    }
  }
  return events;
}

function mockArtifact(overrides: Record<string, unknown> = {}) {
  return {
    id: ARTIFACT_ID,
    workspaceId: WORKSPACE_ID,
    runId: RUN_ID,
    userId: USER_ID,
    domain: "documents",
    status: "initializing",
    title: "paper.pdf",
    description: "Ingested document (upload) — intent: ingest",
    content: {},
    metadata: {},
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function setupDefaultMocks() {
  mockCreateArtifact.mockResolvedValue(mockArtifact());
  // markReady returns the artifact with status: "ready"
  mockMarkReady.mockImplementation(async (artifactId: string) =>
    mockArtifact({ id: artifactId, status: "ready" }),
  );

  // Streaming engine — simulate Redis-backed sequence + hot state
  let seqCounter = 0;
  mockEmitRunEvent.mockImplementation(async () => {
    seqCounter++;
  });
  mockGetRunHotState.mockImplementation(async () => ({
    runId: RUN_ID,
    workspaceId: WORKSPACE_ID,
    status: "running",
    domain: "documents",
    lastEventType: "artifact_ready",
    lastSequence: seqCounter,
    updatedAt: new Date().toISOString(),
    payload: {},
    metadata: {},
  }));
}

// ---------------------------------------------------------------------------

describe("DocumentIngestionOrchestrator", () => {
  const orchestrator = getDocumentIngestionOrchestrator();

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  it("creates a durable document artifact and emits ingestion + artifact_ready events", async () => {
    const { sse, chunks } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    const result = await orchestrator.ingest(
      {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        runId: RUN_ID,
        intent: "ingest",
        kind: "upload",
        fileName: "paper.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        extractedText: "This is the extracted text from the PDF.",
      },
      sse,
      bridge,
    );

    // Artifact should be created with domain "documents"
    expect(mockCreateArtifact).toHaveBeenCalledOnce();
    const createCall = mockCreateArtifact.mock.calls[0][0];
    expect(createCall.domain).toBe("documents");
    expect(createCall.workspaceId).toBe(WORKSPACE_ID);
    expect(createCall.runId).toBe(RUN_ID);
    expect(createCall.userId).toBe(USER_ID);
    expect(createCall.title).toBe("paper.pdf");
    expect(createCall.content.ast).toBeDefined();
    expect(createCall.content.source.kind).toBe("upload");
    expect(createCall.metadata.sourceKind).toBe("upload");
    expect(createCall.metadata.documentIntent).toBe("ingest");

    // Artifact should be marked ready
    expect(mockMarkReady).toHaveBeenCalledWith(ARTIFACT_ID);

    // Result should carry the artifact, source, and ast
    expect(result.artifact.id).toBe(ARTIFACT_ID);
    expect(result.source.id).toBeDefined();
    expect(result.source.artifactId).toBe(ARTIFACT_ID);
    expect(result.source.ingestionStatus).toBe("completed");
    expect(result.ast.blocks.length).toBeGreaterThan(0);

    // SSE stream should contain the canonical events in order
    const events = decodeChunks(chunks);
    const eventTypes = events
      .filter((e) => e.__hermes)
      .map((e) => e.eventType);

    expect(eventTypes).toContain("document_ingestion_started");
    expect(eventTypes).toContain("document_ingestion_progress");
    expect(eventTypes).toContain("document_ingestion_completed");
    expect(eventTypes).toContain("artifact_ready");

    // artifact_ready should carry the artifactId in payload
    const readyEvent = events.find(
      (e) => e.__hermes && e.eventType === "artifact_ready",
    );
    expect(readyEvent.payload.artifactId).toBe(ARTIFACT_ID);
    expect(readyEvent.payload.domain).toBe("documents");
    expect(readyEvent.payload.handoffSurface).toBe("document-editor");

    // ingestion_completed should report completed status
    const completedEvent = events.find(
      (e) => e.__hermes && e.eventType === "document_ingestion_completed",
    );
    expect(completedEvent.payload.status).toBe("completed");
    expect(completedEvent.payload.artifactId).toBe(ARTIFACT_ID);
  });

  it("detects scanned sources when extracted text density is very low", async () => {
    const { sse, chunks } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    // Very low alphanumeric density => scanned
    const lowDensityText = "   \n\n   \t\t   \n\n   ";

    await orchestrator.ingest(
      {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        runId: RUN_ID,
        fileName: "scan.pdf",
        extractedText: lowDensityText,
        pageCount: 3,
      },
      sse,
      bridge,
    );

    const events = decodeChunks(chunks);
    const progressEvent = events.find(
      (e) => e.__hermes && e.eventType === "document_ingestion_progress",
    );
    expect(progressEvent.payload.isScanned).toBe(true);

    // The artifact metadata should record isScanned: true
    const createCall = mockCreateArtifact.mock.calls[0][0];
    expect(createCall.metadata.isScanned).toBe(true);
  });

  it("detects digital sources when extracted text is substantial", async () => {
    const { sse, chunks } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    const digitalText =
      "This is a well-formed digital document with plenty of alphanumeric characters throughout the body text.";

    await orchestrator.ingest(
      {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        runId: RUN_ID,
        fileName: "digital.pdf",
        extractedText: digitalText,
      },
      sse,
      bridge,
    );

    const events = decodeChunks(chunks);
    const progressEvent = events.find(
      (e) => e.__hermes && e.eventType === "document_ingestion_progress",
    );
    expect(progressEvent.payload.isScanned).toBe(false);
  });

  it("emits a failed ingestion_completed event and rethrows when artifact creation fails", async () => {
    const { sse, chunks } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    mockCreateArtifact.mockRejectedValueOnce(new Error("DB write failed"));

    await expect(
      orchestrator.ingest(
        {
          userId: USER_ID,
          workspaceId: WORKSPACE_ID,
          runId: RUN_ID,
          fileName: "broken.pdf",
          extractedText: "text",
        },
        sse,
        bridge,
      ),
    ).rejects.toThrow("DB write failed");

    // Should still have emitted a document_ingestion_completed with failed status
    const events = decodeChunks(chunks);
    const completedEvent = events.find(
      (e) => e.__hermes && e.eventType === "document_ingestion_completed",
    );
    expect(completedEvent).toBeDefined();
    expect(completedEvent.payload.status).toBe("failed");
    expect(completedEvent.payload.error).toBe("DB write failed");
  });

  it("builds a placeholder AST with a single paragraph block carrying the extracted text", async () => {
    const { sse } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    const text = "This is the extracted text content for the AST.";
    const result = await orchestrator.ingest(
      {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        runId: RUN_ID,
        extractedText: text,
      },
      sse,
      bridge,
    );

    expect(result.ast.blocks).toHaveLength(1);
    expect(result.ast.blocks[0].type).toBe("paragraph");
    expect(result.ast.blocks[0].content).toBe(text);
    expect(result.ast.pages.length).toBeGreaterThanOrEqual(1);
  });

  it("uses sourceUrl as the artifact title when no fileName is provided", async () => {
    const { sse } = createMockSSEController();
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);

    await orchestrator.ingest(
      {
        userId: USER_ID,
        workspaceId: WORKSPACE_ID,
        runId: RUN_ID,
        kind: "url",
        sourceUrl: "https://example.com/paper.pdf",
        extractedText: "text",
      },
      sse,
      bridge,
    );

    const createCall = mockCreateArtifact.mock.calls[0][0];
    expect(createCall.title).toBe("https://example.com/paper.pdf");
    expect(createCall.metadata.sourceKind).toBe("url");
  });
});
