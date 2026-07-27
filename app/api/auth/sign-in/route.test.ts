import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockCookies, mockSignInWithPassword } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockSignInWithPassword: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: vi.fn(() => ({
    signInWithPassword: mockSignInWithPassword,
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-key");
    mockCookies.mockResolvedValue({});
  });

  it("returns 400 when email or password is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email: "" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "AUTH_INVALID_REQUEST",
    });
  });

  it("signs in and returns the normalized user", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "if-user-1",
          email: "user@example.com",
          userMetadata: {
            full_name: "Ahsan",
          },
        },
      },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email: " user@example.com ", password: "secret" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(data.user).toMatchObject({
      id: "if-user-1",
      _id: "if-user-1",
      authProvider: "insforge",
    });
  });

  it("returns an auth error when InsForge rejects the credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: {
        error: "AUTH_UNAUTHORIZED",
        message: "Bad credentials",
        statusCode: 401,
      },
    });

    const request = new NextRequest("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com", password: "wrong" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "AUTH_UNAUTHORIZED",
      message: "Bad credentials",
    });
  });
});
