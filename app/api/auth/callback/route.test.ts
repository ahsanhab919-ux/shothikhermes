import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockExchangeOAuthCode } = vi.hoisted(() => ({
  mockExchangeOAuthCode: vi.fn(),
}));

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: vi.fn(() => ({
    exchangeOAuthCode: mockExchangeOAuthCode,
  })),
}));

import { GET } from "./route";

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-key");
  });

  it("exchanges the OAuth code and redirects to the requested in-app path", async () => {
    mockExchangeOAuthCode.mockResolvedValue({
      data: { user: { id: "if-user-1" } },
      error: null,
    });

    const request = new NextRequest(
      "http://127.0.0.1:3000/api/auth/callback?insforge_code=test-code&next=%2Fauth%2Fpost-login",
      {
        headers: {
          cookie: "insforge_code_verifier=verifier-123",
        },
      },
    );

    const response = await GET(request);

    expect(mockExchangeOAuthCode).toHaveBeenCalledWith("test-code", "verifier-123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/post-login");
  });

  it("redirects back to login when the verifier is missing", async () => {
    const request = new NextRequest(
      "http://127.0.0.1:3000/api/auth/callback?insforge_code=test-code",
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login?error=oauth");
  });

  it("redirects back to login when the exchange fails", async () => {
    mockExchangeOAuthCode.mockResolvedValue({
      data: null,
      error: {
        error: "AUTH_OAUTH_FAILED",
        message: "Invalid verifier",
        statusCode: 400,
      },
    });

    const request = new NextRequest(
      "http://127.0.0.1:3000/api/auth/callback?insforge_code=test-code",
      {
        headers: {
          cookie: "insforge_code_verifier=verifier-123",
        },
      },
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login?error=oauth");
  });
});
