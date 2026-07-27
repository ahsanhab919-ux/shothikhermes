import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const listStore = new Map<string, string[]>();
const valueStore = new Map<string, string | Record<string, unknown>>();
const counterStore = new Map<string, number>();

const mockRedis = {
  incr: vi.fn(async (key: string) => {
    const next = (counterStore.get(key) ?? 0) + 1;
    counterStore.set(key, next);
    return next;
  }),
  expire: vi.fn(async () => 1),
  rpush: vi.fn(async (key: string, value: string) => {
    const existing = listStore.get(key) ?? [];
    existing.push(value);
    listStore.set(key, existing);
    return existing.length;
  }),
  lrange: vi.fn(async (key: string, start: number, end: number) => {
    const existing = listStore.get(key) ?? [];
    return existing.slice(start, end + 1);
  }),
  set: vi.fn(async (key: string, value: string | Record<string, unknown>) => {
    valueStore.set(key, value);
    return "OK";
  }),
  get: vi.fn(async (key: string) => valueStore.get(key) ?? null),
};

vi.mock("@/lib/infrastructure/redis", () => ({
  getRedis: vi.fn(() => mockRedis),
}));

vi.mock("@/lib/logger", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { ChatStreamBridge } from "@/lib/hermes/modules/chat-orchestrator/stream-bridge";
import { getHermesStreamingEngine } from "@/lib/hermes/modules/streaming-engine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RUN_ID = "run_bridge_test_001";
const WORKSPACE_ID = "ws_bridge_test_001";
const SESSION_ID = "session_bridge_test_001";

function createMockSSEController() {
  const chunks: Uint8Array[] = [];
  const controller: ReadableStreamDefaultController<Uint8Array> = {
    enqueue: vi.fn((chunk: Uint8Array) => chunks.push(chunk)),
    close: vi.fn(),
    error: vi.fn(),
    desiredSize: null,
  };
  const encoder = new TextEncoder();
  return { controller, encoder, chunks };
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatStreamBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStore.clear();
    valueStore.clear();
    counterStore.clear();
  });

  it("emits canonical HermesEventEnvelope events through Redis and SSE", async () => {
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    const envelope = await bridge.emit(
      sse,
      "run_started",
      { message: "Generating response" },
      { runStatus: "running" },
    );

    // Envelope should have all required HermesEventEnvelope fields
    expect(envelope.eventId).toBeDefined();
    expect(envelope.runId).toBe(RUN_ID);
    expect(envelope.workspaceId).toBe(WORKSPACE_ID);
    expect(envelope.sessionId).toBe(SESSION_ID);
    expect(envelope.domain).toBe("chat");
    expect(envelope.eventType).toBe("run_started");
    expect(envelope.timestamp).toBeDefined();
    expect(envelope.sequence).toBeGreaterThan(0);
    expect(envelope.payload.message).toBe("Generating response");
    expect(envelope.metadata.runStatus).toBe("running");
    expect(envelope.metadata.source).toBe("chat-orchestrator");

    // Redis should have stored the event for replay
    const replayEvents = await getHermesStreamingEngine().getEventsSince(RUN_ID, 0, 10);
    expect(replayEvents).toHaveLength(1);
    expect(replayEvents[0].eventType).toBe("run_started");

    // Hot state should be updated
    const hotState = await getHermesStreamingEngine().getRunHotState(RUN_ID);
    expect(hotState).not.toBeNull();
    expect(hotState!.lastEventType).toBe("run_started");
    expect(hotState!.status).toBe("running");

    // SSE stream should have the event with __hermes marker
    const sseEvents = decodeChunks(sse.chunks);
    expect(sseEvents).toHaveLength(1);
    expect(sseEvents[0].__hermes).toBe(true);
    expect(sseEvents[0].eventType).toBe("run_started");
    expect(sseEvents[0].runId).toBe(RUN_ID);
    expect(sseEvents[0].sequence).toBeGreaterThan(0);
  });

  it("assigns incrementing sequence numbers across multiple events", async () => {
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    await bridge.emit(sse, "session_created", {});
    await bridge.emit(sse, "run_started", {});
    await bridge.emit(sse, "progress_update", { message: "chunk 1" });
    await bridge.emit(sse, "progress_update", { message: "chunk 2" });
    await bridge.emit(sse, "run_completed", {});

    const replayEvents = await getHermesStreamingEngine().getEventsSince(RUN_ID, 0, 10);
    expect(replayEvents).toHaveLength(5);
    expect(replayEvents.map((e) => e.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(replayEvents.map((e) => e.eventType)).toEqual([
      "session_created",
      "run_started",
      "progress_update",
      "progress_update",
      "run_completed",
    ]);
  });

  it("writes legacy events to the SSE stream without Redis persistence", async () => {
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    bridge.writeLegacy(sse, { type: "chunk", content: "Hello" });

    const sseEvents = decodeChunks(sse.chunks);
    expect(sseEvents).toHaveLength(1);
    expect(sseEvents[0].__hermes).toBeUndefined();
    expect(sseEvents[0].type).toBe("chunk");
    expect(sseEvents[0].content).toBe("Hello");

    // Redis should NOT have any events from writeLegacy
    const replayEvents = await getHermesStreamingEngine().getEventsSince(RUN_ID, 0, 10);
    expect(replayEvents).toHaveLength(0);
  });

  it("stores hot state with correct lastEventType after each emit", async () => {
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    await bridge.emit(sse, "run_started", {}, { runStatus: "running" });
    let hotState = await getHermesStreamingEngine().getRunHotState(RUN_ID);
    expect(hotState!.lastEventType).toBe("run_started");
    expect(hotState!.status).toBe("running");

    await bridge.emit(sse, "progress_update", { message: "working" }, { runStatus: "running" });
    hotState = await getHermesStreamingEngine().getRunHotState(RUN_ID);
    expect(hotState!.lastEventType).toBe("progress_update");
    expect(hotState!.message).toBe("working");

    await bridge.emit(sse, "run_completed", {}, { runStatus: "completed" });
    hotState = await getHermesStreamingEngine().getRunHotState(RUN_ID);
    expect(hotState!.lastEventType).toBe("run_completed");
  });

  it("degrades gracefully when Redis is unavailable", async () => {
    // Simulate Redis being unavailable
    vi.mocked(mockRedis.incr).mockRejectedValueOnce(new Error("Redis connection refused"));

    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    // Should not throw — should fall back to local sequence
    const envelope = await bridge.emit(sse, "run_started", {}, { runStatus: "running" });

    // Envelope should still have a sequence (fallback)
    expect(envelope.sequence).toBeGreaterThan(0);

    // SSE stream should still have the event
    const sseEvents = decodeChunks(sse.chunks);
    expect(sseEvents).toHaveLength(1);
    expect(sseEvents[0].__hermes).toBe(true);
    expect(sseEvents[0].eventType).toBe("run_started");
  });

  it("close() closes the SSE controller", async () => {
    const bridge = new ChatStreamBridge(RUN_ID, WORKSPACE_ID, SESSION_ID);
    const sse = createMockSSEController();

    bridge.close(sse);

    expect(sse.controller.close).toHaveBeenCalledOnce();
  });
});
