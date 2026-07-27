import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";
import { normalizeInsforgeUser } from "@/lib/insforge/user";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const redirectTo =
    typeof body?.redirectTo === "string" && body.redirectTo.length > 0
      ? body.redirectTo
      : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/login`;

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
  const { data, error } = await auth.signUp({
    email,
    password,
    ...(name ? { name } : {}),
    redirectTo,
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.error ?? "AUTH_SIGN_UP_FAILED",
        message: error.message ?? "Unable to create account.",
      },
      { status: error.statusCode ?? 400 },
    );
  }

  return NextResponse.json({
    user: normalizeInsforgeUser(data?.user ?? null),
    requiresEmailVerification: Boolean(data?.requireEmailVerification),
  });
}
