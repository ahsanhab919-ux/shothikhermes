import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockCookies, mockSignUp } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockSignUp: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@insforge/sdk/ssr", () => ({
  createAuthActions: vi.fn(() => ({
    signUp: mockSignUp,
  })),
}));

import { POST } from "./route";

describe("POST /api/auth/sign-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_URL", "https://example.insforge.app");
    vi.stubEnv("NEXT_PUBLIC_INSFORGE_ANON_KEY", "anon-key");
    mockCookies.mockResolvedValue({});
  });

  it("returns 400 when email or password is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({ name: "Ahsan" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "AUTH_INVALID_REQUEST",
    });
  });

  it("signs up with the default redirect target", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: {
          id: "if-user-2",
          email: "new@example.com",
          name: "New User",
        },
        requireEmailVerification: true,
      },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "new@example.com",
        password: "secret123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secret123",
      name: "New User",
      redirectTo: "http://localhost:3000/auth/login",
    });
    expect(data).toMatchObject({
      requiresEmailVerification: true,
      user: {
        authProvider: "insforge",
      },
    });
  });

  it("returns the upstream sign-up error", async () => {
    mockSignUp.mockResolvedValue({
      data: null,
      error: {
        error: "AUTH_SIGN_UP_FAILED",
        message: "Email already exists",
        statusCode: 409,
      },
    });

    const request = new NextRequest("http://localhost:3000/api/auth/sign-up", {
      method: "POST",
      body: JSON.stringify({
        email: "used@example.com",
        password: "secret123",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "AUTH_SIGN_UP_FAILED",
      message: "Email already exists",
    });
  });
});
