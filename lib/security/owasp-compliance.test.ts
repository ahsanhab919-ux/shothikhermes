import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { runOwaspChecks } from "@/lib/security/owasp-compliance";

function makeRequest(pathname: string, init?: RequestInit) {
  return new NextRequest(`http://127.0.0.1:3000${pathname}`, init);
}

describe("runOwaspChecks", () => {
  it("allows chat API requests to defer authentication to route-level handling", async () => {
    const request = makeRequest("/api/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("allows public auth API requests to reach InsForge handlers", async () => {
    const request = makeRequest("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        password: "secret123",
      }),
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("allows public OAuth callback routes to complete server-side auth exchange", async () => {
    const request = makeRequest("/api/auth/callback?insforge_code=abc123", {
      method: "GET",
      headers: {
        cookie: "insforge_code_verifier=verifier-123",
      },
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("allows public email verification requests to reach InsForge handlers", async () => {
    const request = makeRequest("/api/auth/verify-email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "user@example.com",
        otp: "123456",
      }),
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("allows the Convex token exchange bridge to return auth diagnostics", async () => {
    const request = makeRequest("/api/auth/convex-token", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        accessToken: "placeholder-token",
      }),
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("allows the public user-limit route to load without authentication", async () => {
    const request = makeRequest("/api/user-limit", {
      method: "GET",
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("still rejects protected non-chat API requests without authentication", async () => {
    const request = makeRequest("/api/admin/example", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ok: true }),
    });

    const result = await runOwaspChecks(request);

    expect(result.passed).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "API2",
          message: "Authentication required",
        }),
      ]),
    );
  });
});
