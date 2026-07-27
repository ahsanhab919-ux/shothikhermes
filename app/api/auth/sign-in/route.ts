import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";
import { normalizeInsforgeUser } from "@/lib/insforge/user";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "AUTH_INVALID_REQUEST", message: "Email and password are required." },
      { status: 400 },
    );
  }

  const auth = createAuthActions({
    cookies: await cookies(),
    ...getInsforgePublicConfig(),
  });
  const { data, error } = await auth.signInWithPassword({ email, password });

  if (error || !data?.user) {
    return NextResponse.json(
      {
        error: error?.error ?? "AUTH_UNAUTHORIZED",
        message: error?.message ?? "Unable to sign in.",
      },
      { status: error?.statusCode ?? 401 },
    );
  }

  return NextResponse.json({ user: normalizeInsforgeUser(data.user) });
}
