import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockSignInWithOAuth } = vi.hoisted(() => ({
  mockSignInWithOAuth: vi.fn(),
}));

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: vi.fn(() => ({
    signInWithOAuth: mockSignInWithOAuth,
  })),
}));

import { GET } from "./route";

describe("GET /api/auth/oauth/google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-key");
  });

  it("starts Google OAuth and stores the PKCE verifier cookie", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: {
        url: "https://example.insforge.app/api/auth/oauth/google?challenge=abc",
        codeVerifier: "verifier-123",
      },
      error: null,
    });

    const request = new NextRequest("http://127.0.0.1:3000/api/auth/oauth/google?next=%2Fauth%2Fpost-login");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.insforge.app/api/auth/oauth/google?challenge=abc",
    );
    expect(mockSignInWithOAuth).toHaveBeenCalledWith("google", {
      redirectTo: "http://localhost:3000/api/auth/callback?next=%2Fauth%2Fpost-login",
      skipBrowserRedirect: true,
    });
    expect(response.cookies.get("insforge_code_verifier")?.value).toBe("verifier-123");
  });

  it("falls back to the login page when OAuth initialization fails", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: {
        error: "AUTH_OAUTH_FAILED",
        message: "Provider unavailable",
        statusCode: 400,
      },
    });

    const request = new NextRequest("http://127.0.0.1:3000/api/auth/oauth/google");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/auth/login?error=oauth");
  });
});
