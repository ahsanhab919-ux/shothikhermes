import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be defined before any imports that reference them
// ---------------------------------------------------------------------------

const {
  mockGetConversationForUser,
  mockCreatePersistedConversation,
  mockAppendPersistedUserMessage,
  mockCreatePersistedAssistantMessage,
  mockAppendPersistedAssistantChunk,
  mockCompletePersistedAssistantMessage,
  mockStopPersistedAssistantMessage,
  mockFailPersistedAssistantMessage,
} = vi.hoisted(() => ({
  mockGetConversationForUser: vi.fn(),
  mockCreatePersistedConversation: vi.fn(),
  mockAppendPersistedUserMessage: vi.fn(),
  mockCreatePersistedAssistantMessage: vi.fn(),
  mockAppendPersistedAssistantChunk: vi.fn(),
  mockCompletePersistedAssistantMessage: vi.fn(),
  mockStopPersistedAssistantMessage: vi.fn(),
  mockFailPersistedAssistantMessage: vi.fn(),
}));

const {
  mockCreateRun,
  mockStartRun,
  mockCompleteRun,
  mockResumeSession,
  mockCreateSession,
  mockGetSessionContext,
  mockCreateWorkspace,
  mockGetUserWorkspaces,
} = vi.hoisted(() => ({
  mockCreateRun: vi.fn(),
  mockStartRun: vi.fn(),
  mockCompleteRun: vi.fn(),
  mockResumeSession: vi.fn(),
  mockCreateSession: vi.fn(),
  mockGetSessionContext: vi.fn(),
  mockCreateWorkspace: vi.fn(),
  mockGetUserWorkspaces: vi.fn(),
}));

// Mock lib/chat/server
vi.mock("@/lib/chat/server", () => ({
  getConversationForUser: mockGetConversationForUser,
  createPersistedConversation: mockCreatePersistedConversation,
  appendPersistedUserMessage: mockAppendPersistedUserMessage,
  createPersistedAssistantMessage: mockCreatePersistedAssistantMessage,
  appendPersistedAssistantChunk: mockAppendPersistedAssistantChunk,
  completePersistedAssistantMessage: mockCompletePersistedAssistantMessage,
  stopPersistedAssistantMessage: mockStopPersistedAssistantMessage,
  failPersistedAssistantMessage: mockFailPersistedAssistantMessage,
}));

// Mock lib/hermes — the orchestrator singleton
vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    createRun: mockCreateRun,
    startRun: mockStartRun,
    completeRun: mockCompleteRun,
    resumeSession: mockResumeSession,
    createSession: mockCreateSession,
    getSessionContext: mockGetSessionContext,
    workspaceManager: {
      createWorkspace: mockCreateWorkspace,
      getUserWorkspaces: mockGetUserWorkspaces,
    },
  })),
}));

// Mock the streaming engine — the ChatStreamBridge uses it for Redis-backed
// event persistence (replay, hot state, sequence assignment).
const { mockEmitRunEvent, mockGetRunHotState } = vi.hoisted(() => ({
  mockEmitRunEvent: vi.fn(),
  mockGetRunHotState: vi.fn(),
}));

vi.mock("@/lib/hermes/modules/streaming-engine", () => ({
  getHermesStreamingEngine: vi.fn(() => ({
    emitRunEvent: mockEmitRunEvent,
    getRunHotState: mockGetRunHotState,
  })),
}));

// Mock the document ingestion orchestrator — the chat orchestrator calls
// ingest() when a document turn is detected. We capture the call to verify
// routing without exercising the real ingestion pipeline here (that has its
// own focused test file).
const { mockIngest } = vi.hoisted(() => ({
  mockIngest: vi.fn(),
}));

vi.mock("@/lib/hermes/modules/document-ingestion-orchestrator", () => ({
  getDocumentIngestionOrchestrator: vi.fn(() => ({
    ingest: mockIngest,
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

import { getChatOrchestrator, ChatOrchestratorError } from "@/lib/hermes/modules/chat-orchestrator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = "user-test-001";
const CONVERSATION_ID = "conv-test-001";
const WORKSPACE_ID = "ws_test_001";
const SESSION_ID = "session_test_001";
const RUN_ID = "run_test_001";

function mockConversation() {
  return {
    _id: CONVERSATION_ID,
    userId: USER_ID,
    surface: "flagship",
    title: "Test conversation",
    status: "active",
    pinned: false,
    temporary: false,
    modelHandle: "gemini-2.5-flash",
    lastMessageAt: Date.now(),
    messageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function mockWorkspace() {
  return {
    id: WORKSPACE_ID,
    userId: USER_ID,
    title: "Chat — Test conversation",
    description: "Default workspace for chat conversations",
    settings: {},
    metadata: { sourceType: "chat", chatWorkspace: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function mockSession() {
  return {
    id: SESSION_ID,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    title: "Test conversation",
    description: "Chat conversation: Test conversation",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    settings: {},
    metadata: { conversationId: CONVERSATION_ID },
  };
}

function mockRun() {
  return {
    id: RUN_ID,
    sessionId: SESSION_ID,
    workspaceId: WORKSPACE_ID,
    userId: USER_ID,
    domain: "chat",
    status: "created",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {},
    metadata: {},
  };
}

function mockUserMessage() {
  return { _id: "msg_user_001", conversationId: CONVERSATION_ID, role: "user", content: "Hello" };
}

function mockAssistantMessage() {
  return { _id: "msg_asst_001", conversationId: CONVERSATION_ID, role: "assistant", content: "" };
}

/** Set up the default mock returns for a successful chat turn */
function setupDefaultMocks(opts?: {
  existingWorkspace?: boolean;
  existingConversation?: boolean;
  providedSessionId?: string;
}) {
  // Conversation
  if (opts?.existingConversation) {
    mockGetConversationForUser.mockResolvedValue(mockConversation());
  } else {
    mockCreatePersistedConversation.mockResolvedValue(mockConversation());
  }

  // Workspace — either reuse existing or create new
  if (opts?.existingWorkspace) {
    mockGetUserWorkspaces.mockResolvedValue([mockWorkspace()]);
  } else {
    mockGetUserWorkspaces.mockResolvedValue([]);
    mockCreateWorkspace.mockResolvedValue(mockWorkspace());
  }

  // Session
  if (opts?.providedSessionId) {
    mockGetSessionContext.mockResolvedValue({
      session: { ...mockSession(), id: opts.providedSessionId },
      workspace: mockWorkspace(),
      runs: [],
      canResume: true,
    });
  } else {
    mockCreateSession.mockResolvedValue(mockSession());
  }
  // Always set up resumeSession since it's called on completion
  mockResumeSession.mockResolvedValue(undefined);

  // Run
  mockCreateRun.mockResolvedValue(mockRun());
  mockStartRun.mockResolvedValue(undefined);
  mockCompleteRun.mockResolvedValue(undefined);

  // Messages
  mockAppendPersistedUserMessage.mockResolvedValue(mockUserMessage());
  mockCreatePersistedAssistantMessage.mockResolvedValue(mockAssistantMessage());
  mockAppendPersistedAssistantChunk.mockResolvedValue(mockAssistantMessage());
  mockCompletePersistedAssistantMessage.mockResolvedValue(mockAssistantMessage());
  mockStopPersistedAssistantMessage.mockResolvedValue(mockAssistantMessage());
  mockFailPersistedAssistantMessage.mockResolvedValue(mockAssistantMessage());

  // Streaming engine — simulate Redis-backed sequence + hot state
  let seqCounter = 0;
  mockEmitRunEvent.mockImplementation(async () => {
    seqCounter++;
  });
  mockGetRunHotState.mockImplementation(async () => ({
    runId: RUN_ID,
    workspaceId: WORKSPACE_ID,
    status: "running",
    domain: "chat",
    lastEventType: "run_started",
    lastSequence: seqCounter,
    updatedAt: new Date().toISOString(),
    payload: {},
    metadata: {},
  }));
}

/** Read all SSE events from a ReadableStream */
async function readSSEStream(stream: ReadableStream<Uint8Array>): Promise<any[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // skip malformed
      }
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatOrchestrator session binding", () => {
  const orchestrator = getChatOrchestrator();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new Hermes session on the first chat turn (no existing conversation)", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello, what is photosynthesis?" }],
    });

    // Should have created a conversation
    expect(mockCreatePersistedConversation).toHaveBeenCalledOnce();

    // Should have created a workspace (no existing one)
    expect(mockCreateWorkspace).toHaveBeenCalledOnce();

    // Should have created a session
    expect(mockCreateSession).toHaveBeenCalledOnce();
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        title: "Test conversation",
      }),
    );

    // Should have created a run with sessionId bound
    expect(mockCreateRun).toHaveBeenCalledOnce();
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
        domain: "chat",
        sessionId: SESSION_ID,
      }),
    );

    // Result should include sessionId and workspaceId
    expect(result.sessionId).toBe(SESSION_ID);
    expect(result.workspaceId).toBe(WORKSPACE_ID);
    expect(result.runId).toBe(RUN_ID);
    expect(result.conversationId).toBe(CONVERSATION_ID);
  });

  it("resumes an existing Hermes session when sessionId is provided", async () => {
    const EXISTING_SESSION = "session_existing_999";
    setupDefaultMocks({
      existingWorkspace: true,
      existingConversation: true,
      providedSessionId: EXISTING_SESSION,
    });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Follow-up question" }],
      conversationId: CONVERSATION_ID,
      sessionId: EXISTING_SESSION,
    });

    // Should NOT create a new session
    expect(mockCreateSession).not.toHaveBeenCalled();

    // Should have resumed the existing session
    expect(mockResumeSession).toHaveBeenCalledWith(EXISTING_SESSION);

    // Should have looked up the session context
    expect(mockGetSessionContext).toHaveBeenCalledWith(EXISTING_SESSION);

    // Result should carry the resumed sessionId
    expect(result.sessionId).toBe(EXISTING_SESSION);
  });

  it("emits session_created and run_started events in the SSE stream", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
    });

    const events = await readSSEStream(result.stream);

    // Should have session_created as a canonical Hermes event
    const sessionEvent = events.find(
      (e) => e.__hermes && e.eventType === "session_created",
    );
    expect(sessionEvent).toBeDefined();
    expect(sessionEvent.sessionId).toBe(SESSION_ID);
    expect(sessionEvent.workspaceId).toBe(WORKSPACE_ID);
    // Canonical envelope fields
    expect(sessionEvent.eventId).toBeDefined();
    expect(sessionEvent.sequence).toBeGreaterThan(0);
    expect(sessionEvent.domain).toBe("chat");
    expect(sessionEvent.timestamp).toBeDefined();

    // Should also have run_started (renamed from run_created)
    const runEvent = events.find(
      (e) => e.__hermes && e.eventType === "run_started",
    );
    expect(runEvent).toBeDefined();
    expect(runEvent.runId).toBe(RUN_ID);
    expect(runEvent.sessionId).toBe(SESSION_ID);
  });

  it("reuses an existing chat workspace instead of creating a new one", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: false });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
    });

    // Should NOT create a workspace
    expect(mockCreateWorkspace).not.toHaveBeenCalled();

    // Should have queried user workspaces
    expect(mockGetUserWorkspaces).toHaveBeenCalledWith(USER_ID, 50);

    expect(result.workspaceId).toBe(WORKSPACE_ID);
  });

  it("throws ChatOrchestratorError when provided sessionId is not found", async () => {
    setupDefaultMocks({ existingConversation: true });
    mockGetSessionContext.mockResolvedValue(null);

    await expect(
      orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [{ role: "user", content: "Hello" }],
        sessionId: "nonexistent_session",
      }),
    ).rejects.toThrow(ChatOrchestratorError);

    try {
      await orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [{ role: "user", content: "Hello" }],
        sessionId: "nonexistent_session",
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ChatOrchestratorError);
      expect((e as ChatOrchestratorError).statusCode).toBe(404);
    }
  });

  it("throws ChatOrchestratorError when provided sessionId belongs to another user", async () => {
    setupDefaultMocks({ existingConversation: true });
    mockGetSessionContext.mockResolvedValue({
      session: { ...mockSession(), userId: "different_user" },
      workspace: mockWorkspace(),
      runs: [],
      canResume: false,
    });

    await expect(
      orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [{ role: "user", content: "Hello" }],
        sessionId: "session_other_user",
      }),
    ).rejects.toThrow(ChatOrchestratorError);

    try {
      await orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [{ role: "user", content: "Hello" }],
        sessionId: "session_other_user",
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ChatOrchestratorError);
      expect((e as ChatOrchestratorError).statusCode).toBe(403);
    }
  });

  it("throws ChatOrchestratorError when messages array is empty", async () => {
    await expect(
      orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [],
      }),
    ).rejects.toThrow(ChatOrchestratorError);

    try {
      await orchestrator.executeChatTurn({
        userId: USER_ID,
        messages: [],
      });
    } catch (e) {
      expect((e as ChatOrchestratorError).statusCode).toBe(400);
    }
  });

  it("binds sessionId to the created run", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
    });

    // The createRun call must include sessionId in the request
    const createRunCall = mockCreateRun.mock.calls[0][0];
    expect(createRunCall.sessionId).toBe(SESSION_ID);
    expect(createRunCall.workspaceId).toBe(WORKSPACE_ID);
    expect(createRunCall.domain).toBe("chat");
  });

  it("stores low-cost lane metadata for a plain answer turn", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
    });

    const createRunCall = mockCreateRun.mock.calls[0][0];
    expect(createRunCall.metadata.execution).toEqual(
      expect.objectContaining({
        workflow: "default",
        lane: "lane_0",
        maxModelTier: "cheap",
        estimatedCostTier: "low",
        resumeMode: "new_session",
        retrievalPlan: expect.objectContaining({
          intent: "none",
          costBudget: "low",
        }),
      }),
    );
    expect(createRunCall.metadata.routeMetadata).toEqual(
      expect.objectContaining({
        backend: "direct_provider",
        provider: "gemini",
        capabilityId: "conversation.respond",
        sourceRequestPath: "/api/chat",
        targetBackendService: "google_generative_language",
      }),
    );
  });

  it("stores elevated retrieval metadata for /spec turns before run creation", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "/spec Draft a scalable chat runtime spec" }],
    });

    const createRunCall = mockCreateRun.mock.calls[0][0];
    expect(createRunCall.metadata.execution).toEqual(
      expect.objectContaining({
        workflow: "spec",
        workflowArgument: "Draft a scalable chat runtime spec",
        lane: "lane_1",
        maxModelTier: "advanced",
        estimatedCostTier: "high",
        retrievalPlan: expect.objectContaining({
          intent: "action_grounded_retrieval",
          costBudget: "medium",
        }),
      }),
    );
    expect(createRunCall.metadata.routeMetadata).toEqual(
      expect.objectContaining({
        capabilityId: "reasoning.plan",
      }),
    );
  });

  it("propagates route metadata tags into canonical SSE events", async () => {
    setupDefaultMocks({ existingWorkspace: false, existingConversation: false });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
      sourceRequestPath: "/api/chat",
      sourceRequestUrl: "http://localhost:3000/api/chat",
    });

    const events = await readSSEStream(result.stream);
    const runEvent = events.find(
      (event) => event.__hermes && event.eventType === "run_started",
    );

    expect(runEvent?.metadata).toEqual(
      expect.objectContaining({
        routeMetadata: expect.objectContaining({
          routeId: expect.any(String),
          sourceRequestPath: "/api/chat",
          targetBackendService: "google_generative_language",
        }),
      }),
    );
  });

  it("touches session lastActiveAt on successful completion", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: true });

    // Set the API key so the provider call path is taken
    process.env.AI_INTEGRATIONS_GEMINI_API_KEY = "test-key";

    // Set up a mock provider response by mocking global fetch
    const originalFetch = globalThis.fetch;
    const encoder = new TextEncoder();
    const mockSSEBody = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"Hi there"}]}}]}\n'),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n'));
        controller.close();
      },
    });
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockSSEBody,
      status: 200,
    }) as any;

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello" }],
      conversationId: CONVERSATION_ID,
    });

    // Drain the stream so the finally block runs
    await readSSEStream(result.stream);

    // resumeSession should have been called to touch lastActiveAt
    // on successful completion
    expect(mockResumeSession).toHaveBeenCalled();

    // Restore
    globalThis.fetch = originalFetch;
    delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  });
});

// ---------------------------------------------------------------------------
// Document intelligence routing
// ---------------------------------------------------------------------------

describe("ChatOrchestrator document intelligence routing", () => {
  const orchestrator = getChatOrchestrator();

  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
    // Default: ingestion returns a fake artifact
    mockIngest.mockResolvedValue({
      artifact: { id: "art_doc_001" },
      source: { id: "docsrc_1" },
      ast: { id: "ast_1", blocks: [] },
    });
  });

  it("routes a PDF attachment to the document ingestion orchestrator and surfaces artifactId", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: true });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Summarize this paper" }],
      conversationId: CONVERSATION_ID,
      attachments: [
        {
          id: "att_1",
          kind: "file",
          name: "research-paper.pdf",
          mimeType: "application/pdf",
          preview: "120 KB",
        },
      ],
      context: "Extracted text from the PDF body.",
    });

    // Drain the stream so the start() closure runs ingestion
    await readSSEStream(result.stream);

    // The ingestion orchestrator should have been called
    expect(mockIngest).toHaveBeenCalledOnce();
    const ingestCall = mockIngest.mock.calls[0][0];
    expect(ingestCall.userId).toBe(USER_ID);
    expect(ingestCall.workspaceId).toBe(WORKSPACE_ID);
    expect(ingestCall.runId).toBe(RUN_ID);
    expect(ingestCall.kind).toBe("upload");
    expect(ingestCall.fileName).toBe("research-paper.pdf");
    expect(ingestCall.mimeType).toBe("application/pdf");
    // extractedText should come from the forwarded context string
    expect(ingestCall.extractedText).toContain("Extracted text from the PDF");
  });

  it("routes an explicit documentIntent + sourceUrl to ingestion even without a file attachment", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: true });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Ingest this URL" }],
      conversationId: CONVERSATION_ID,
      documentIntent: "ingest",
      sourceUrl: "https://example.com/paper.pdf",
    });

    // Drain the stream so the start() closure runs ingestion
    await readSSEStream(result.stream);

    expect(mockIngest).toHaveBeenCalledOnce();
    const ingestCall = mockIngest.mock.calls[0][0];
    expect(ingestCall.kind).toBe("url");
    expect(ingestCall.sourceUrl).toBe("https://example.com/paper.pdf");
    expect(ingestCall.intent).toBe("ingest");
  });

  it("does NOT route to ingestion when there is no document attachment or intent", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: true });

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Hello, what is photosynthesis?" }],
      conversationId: CONVERSATION_ID,
    });

    await readSSEStream(result.stream);

    expect(mockIngest).not.toHaveBeenCalled();
  });

  it("continues to the model response even if ingestion throws", async () => {
    setupDefaultMocks({ existingWorkspace: true, existingConversation: true });
    mockIngest.mockRejectedValueOnce(new Error("ingestion blew up"));

    const result = await orchestrator.executeChatTurn({
      userId: USER_ID,
      messages: [{ role: "user", content: "Summarize this" }],
      conversationId: CONVERSATION_ID,
      attachments: [
        {
          id: "att_1",
          kind: "file",
          name: "paper.pdf",
          mimeType: "application/pdf",
        },
      ],
      context: "PDF text",
    });

    // Drain the stream — ingestion runs inside start()
    await readSSEStream(result.stream);

    // Ingestion was attempted
    expect(mockIngest).toHaveBeenCalledOnce();
    // But the chat turn should still produce a stream (no throw)
    expect(result.stream).toBeDefined();
  });
});
