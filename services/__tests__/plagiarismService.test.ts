import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock('@/lib/ai-gateway', () => ({
  executeWithGateway: vi.fn(async (fn: (signal: AbortSignal | undefined) => Promise<unknown>) => {
    const result = await fn(undefined);
    return { data: result };
  }),
}));

vi.mock('@/lib/result-cache', () => ({
  computeContentHash: vi.fn(async () => 'mock-hash'),
  getCachedResult: vi.fn(() => null),
  setCachedResult: vi.fn(),
}));

import {
  analyzePlagiarism,
  PlagiarismServiceError,
  QuotaExceededError,
  ServerUnavailableError,
  UnauthorizedError,
} from "../plagiarismService";

interface MockFetchOptions {
  ok: boolean;
  status: number;
  json: unknown;
}

function buildFetchResponse({ ok, status, json }: MockFetchOptions): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(json),
    text: vi.fn().mockResolvedValue(JSON.stringify(json)),
    headers: new Headers(),
  } as unknown as Response;
}

describe("plagiarismService", () => {
  const token = "test-token";
  const text = "Sample text to analyze.";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "https://api-qa.shothik.ai";
    process.env.NEXT_PUBLIC_PLAGIARISM_REDIRECT_PREFIX = "check";
  });

  it("throws validation error when text is empty", async () => {
    await expect(
      analyzePlagiarism({ text: "  ", token }),
    ).rejects.toBeInstanceOf(PlagiarismServiceError);
  });

  it("throws when baseUrl is not configured", async () => {
    await expect(
      analyzePlagiarism({ text, token, baseUrl: "" }),
    ).rejects.toBeInstanceOf(PlagiarismServiceError);
  });

  it("sends request and returns response for valid text", async () => {
    const rawResponse = {
      overallSimilarity: 0.1,
      paraphrasedSections: [],
      summary: { paraphrasedCount: 0, exactMatchCount: 0, riskLevel: "LOW" },
      timestamp: "2025-01-01T00:00:00.000Z",
      hasPlagiarism: false,
      needsReview: false,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      buildFetchResponse({ ok: true, status: 200, json: rawResponse }),
    );

    const result = await analyzePlagiarism({
      text,
      token,
      baseUrl: "https://api-qa.shothik.ai/check",
    });

    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("riskLevel");
  });

  it("throws UnauthorizedError for 401 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 401,
        json: { message: "Unauthorized" },
      }),
    );

    await expect(
      analyzePlagiarism({ text, token, baseUrl: "https://api-qa.shothik.ai/check" }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws QuotaExceededError for 429 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 429,
        json: { message: "Too Many Requests" },
      }),
    );

    await expect(
      analyzePlagiarism({ text, token, baseUrl: "https://api-qa.shothik.ai/check" }),
    ).rejects.toBeInstanceOf(QuotaExceededError);
  });

  it("throws ServerUnavailableError for 500 responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      buildFetchResponse({
        ok: false,
        status: 503,
        json: { message: "Service Unavailable" },
      }),
    );

    await expect(
      analyzePlagiarism({ text, token, baseUrl: "https://api-qa.shothik.ai/check" }),
    ).rejects.toBeInstanceOf(ServerUnavailableError);
  });
});
