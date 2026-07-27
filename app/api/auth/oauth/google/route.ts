import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

import { getInsforgePublicConfig } from "@/lib/insforge/config";

function normalizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/auth/post-login";
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get("next"));
  const callbackUrl = new URL("/api/auth/callback", request.nextUrl.origin);
  callbackUrl.searchParams.set("next", nextPath);
  const cookieResponse = NextResponse.next();

  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: cookieResponse.cookies,
    ...getInsforgePublicConfig(),
  });

  const { data, error } = await auth.signInWithOAuth("google", {
    redirectTo: callbackUrl.toString(),
    skipBrowserRedirect: true,
  });

  if (error || !data?.url || !data.codeVerifier) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth", request.url));
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set("insforge_code_verifier", data.codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
