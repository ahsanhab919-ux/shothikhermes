import { describe, expect, it } from "vitest";

import {
  AUTH_POST_LOGIN_PATH,
  getAuthenticatedAuthRedirectPath,
  getAuthRateLimitConfig,
} from "../auth-route-guard";

describe("auth-route-guard", () => {
  it("redirects authenticated auth-page visits to post-login", () => {
    expect(getAuthenticatedAuthRedirectPath("/auth/login")).toBe(AUTH_POST_LOGIN_PATH);
    expect(getAuthenticatedAuthRedirectPath("/auth/register")).toBe(AUTH_POST_LOGIN_PATH);
    expect(getAuthenticatedAuthRedirectPath("/auth/verify-email")).toBe(AUTH_POST_LOGIN_PATH);
  });

  it("preserves a safe redirect target for authenticated auth-page visits", () => {
    const params = new URLSearchParams({ redirect: "/agents/chat" });

    expect(getAuthenticatedAuthRedirectPath("/auth/login", params)).toBe(
      "/auth/post-login?redirect=%2Fagents%2Fchat",
    );
  });

  it("does not redirect the post-login page or non-auth routes", () => {
    expect(getAuthenticatedAuthRedirectPath(AUTH_POST_LOGIN_PATH)).toBeNull();
    expect(getAuthenticatedAuthRedirectPath("/agents/chat")).toBeNull();
  });

  it("disables auth rate limiting in development and keeps production limits", () => {
    expect(getAuthRateLimitConfig(true)).toBeNull();
    expect(getAuthRateLimitConfig(false)).toEqual({
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    });
  });
});
