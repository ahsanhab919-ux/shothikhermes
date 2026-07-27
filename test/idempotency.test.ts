import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/infrastructure/redis", () => ({
  getRedis: vi.fn(),
  redisSetIfNotExists: vi.fn(),
}));

import { getRedis, redisSetIfNotExists } from "@/lib/infrastructure/redis";
import { handleIdempotency, markIdempotencyPending } from "@/lib/security/idempotency";

const mockGetRedis = vi.mocked(getRedis);
const mockRedisSetIfNotExists = vi.mocked(redisSetIfNotExists);

describe("idempotency", () => {
  const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRedis.mockReturnValue(mockRedis as any);
    mockRedisSetIfNotExists.mockResolvedValue(true);
  });

  it("uses atomic reservation when marking a request pending", async () => {
    const result = await markIdempotencyPending("request-key-123456", "user-1", "runs", 120);

    expect(result).toBe(true);
    expect(mockRedis.get).not.toHaveBeenCalled();
    expect(mockRedisSetIfNotExists).toHaveBeenCalledWith(
      "idempotency:user-1:runs:request-key-123456",
      expect.objectContaining({ status: "pending" }),
      120,
    );
  });

  it("replays a cached completed response", async () => {
    mockRedis.get.mockResolvedValue({
      status: "completed",
      response: { ok: true },
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000,
    });

    const request = new Request("https://example.com/api/runs", {
      headers: { "idempotency-key": "request-key-123456" },
    });
    Object.assign(request, { user: { id: "user-1" } });

    const result = await handleIdempotency(request, "runs");

    expect(result.shouldProceed).toBe(false);
    expect(result.cachedResponse?.status).toBe(200);
    expect(result.cachedResponse?.headers.get("Idempotency-Replay")).toBe("true");
    await expect(result.cachedResponse?.json()).resolves.toEqual({ ok: true });
  });
});
