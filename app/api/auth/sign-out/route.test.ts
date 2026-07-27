import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, mockSignOut } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: vi.fn(() => ({
    signOut: mockSignOut,
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-key");
    mockCookies.mockResolvedValue({});
  });

  it("signs out successfully", async () => {
    mockSignOut.mockResolvedValue({
      error: null,
    });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns the upstream sign-out error", async () => {
    mockSignOut.mockResolvedValue({
      error: {
        error: "AUTH_SIGN_OUT_FAILED",
        message: "Session already expired",
        statusCode: 400,
      },
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "AUTH_SIGN_OUT_FAILED",
      message: "Session already expired",
    });
  });
});
