import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockDiagnoseConvexJwtConfig } = vi.hoisted(() => ({
  mockDiagnoseConvexJwtConfig: vi.fn(),
}));

vi.mock("@/lib/convex/auth-diagnostics", () => ({
  CONVEX_APPLICATION_ID: "shothik-publishing",
  CONVEX_JWT_KID: "shothik-convex-1",
  getConvexSiteUrl: vi.fn(() => "https://example.convex.site"),
  diagnoseConvexJwtConfig: mockDiagnoseConvexJwtConfig,
}));

vi.mock("jose", () => ({
  importPKCS8: vi.fn(),
  SignJWT: vi.fn(),
}));

import { POST } from "./route";

describe("POST /api/auth/convex-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a structured 503 when Convex JWT config is degraded", async () => {
    mockDiagnoseConvexJwtConfig.mockReturnValue({
      status: "degraded",
      issueCode: "CONVEX_JWT_KEY_MISMATCH",
      message: "JWT_PRIVATE_KEY does not match CONVEX_JWT_PUBLIC_KEY_N.",
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/auth/convex-token", {
        method: "POST",
        body: JSON.stringify({ accessToken: "token" }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe("CONVEX_JWT_KEY_MISMATCH");
    expect(data.message).toContain("JWT_PRIVATE_KEY");
  });
});
