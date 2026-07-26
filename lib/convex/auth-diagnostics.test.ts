import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreatePrivateKey, mockCreatePublicKey } = vi.hoisted(() => ({
  mockCreatePrivateKey: vi.fn(),
  mockCreatePublicKey: vi.fn(),
}));

vi.mock("node:crypto", () => ({
  default: {
    createPrivateKey: mockCreatePrivateKey,
    createPublicKey: mockCreatePublicKey,
  },
}));

import {
  diagnoseConvexJwtConfig,
} from "./auth-diagnostics";
import { getConfiguredConvexJwtPublicKeyN } from "./jwt-config";

describe("diagnoseConvexJwtConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site");
    vi.stubEnv("JWT_PRIVATE_KEY", "private-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports a key mismatch when the derived public modulus differs", () => {
    mockCreatePrivateKey.mockReturnValue({ key: "private" });
    mockCreatePublicKey.mockReturnValue({
      export: vi.fn(() => ({ n: "different-modulus", e: "AQAB" })),
    });

    const result = diagnoseConvexJwtConfig();

    expect(result.status).toBe("degraded");
    expect(result.issueCode).toBe("CONVEX_JWT_KEY_MISMATCH");
    expect(result.keypairMatches).toBe(false);
  });

  it("reports a healthy state when the derived public modulus matches", () => {
    mockCreatePrivateKey.mockReturnValue({ key: "private" });
    mockCreatePublicKey.mockReturnValue({
      export: vi.fn(() => ({ n: getConfiguredConvexJwtPublicKeyN(), e: "AQAB" })),
    });

    const result = diagnoseConvexJwtConfig();

    expect(result.status).toBe("healthy");
    expect(result.keypairMatches).toBe(true);
  });

  it("reports missing site URL configuration", () => {
    vi.stubEnv("CONVEX_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");

    const result = diagnoseConvexJwtConfig();

    expect(result.status).toBe("degraded");
    expect(result.issueCode).toBe("CONVEX_SITE_URL_MISSING");
  });
});
