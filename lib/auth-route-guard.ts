export const AUTH_POST_LOGIN_PATH = "/auth/post-login";

function isSafeInternalPath(path: string | null | undefined): path is string {
  return Boolean(
    path &&
      path.startsWith("/") &&
      !path.startsWith("//") &&
      !path.includes("://"),
  );
}

export function getAuthenticatedAuthRedirectPath(
  pathname: string,
  searchParams?: URLSearchParams,
): string | null {
  if (!pathname.startsWith("/auth")) {
    return null;
  }

  if (pathname === AUTH_POST_LOGIN_PATH) {
    return null;
  }

  const explicitRedirect = searchParams?.get("redirect");
  if (isSafeInternalPath(explicitRedirect)) {
    return `${AUTH_POST_LOGIN_PATH}?redirect=${encodeURIComponent(explicitRedirect)}`;
  }

  return AUTH_POST_LOGIN_PATH;
}

export function getAuthRateLimitConfig(isDev: boolean) {
  if (isDev) {
    return null;
  }

  return {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  };
}
