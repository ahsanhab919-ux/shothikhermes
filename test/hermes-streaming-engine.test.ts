import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredValue = string | Record<string, unknown>;

const listStore = new Map<string, string[]>();
const valueStore = new Map<string, StoredValue>();
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
  set: vi.fn(async (key: string, value: StoredValue) => {
    valueStore.set(key, value);
    return "OK";
  }),
  get: vi.fn(async (key: string) => valueStore.get(key) ?? null),
};

vi.mock("@/lib/infrastructure/redis", () => ({
  getRedis: vi.fn(() => mockRedis),
}));

import { HermesStreamingEngine } from "@/lib/hermes/modules/streaming-engine";

describe("HermesStreamingEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStore.clear();
    valueStore.clear();
    counterStore.clear();
  });

  it("assigns incrementing sequence numbers and stores hot state", async () => {
    const engine = new HermesStreamingEngine();

    await engine.emitRunEvent({
      eventId: "11111111-1111-1111-1111-111111111111",
      runId: "run_1",
      workspaceId: "ws_1",
      domain: "slides",
      eventType: "run_created",
      timestamp: "2026-07-25T10:00:00.000Z",
      sequence: 0,
      payload: { message: "Created" },
      metadata: { runStatus: "created" },
    });

    await engine.emitRunEvent({
      eventId: "22222222-2222-2222-2222-222222222222",
      runId: "run_1",
      workspaceId: "ws_1",
      domain: "slides",
      eventType: "progress_update",
      timestamp: "2026-07-25T10:00:05.000Z",
      sequence: 0,
      payload: { message: "Working" },
      metadata: { runStatus: "running" },
    });

    const events = await engine.getEventsSince("run_1", 0, 10);
    const hotState = await engine.getRunHotState("run_1");

    expect(events.map((event) => event.sequence)).toEqual([1, 2]);
    expect(hotState).toMatchObject({
      runId: "run_1",
      lastSequence: 2,
      lastEventType: "progress_update",
      message: "Working",
      status: "running",
    });
  });
});
