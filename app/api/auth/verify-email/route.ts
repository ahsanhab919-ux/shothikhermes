import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";

import { getInsforgePublicConfig } from "@/lib/insforge/config";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!email || !otp) {
    return NextResponse.json(
      { error: "AUTH_INVALID_REQUEST", message: "Email and verification code are required." },
      { status: 400 },
    );
  }

  const auth = createAuthActions({
    cookies: await cookies(),
    ...getInsforgePublicConfig(),
  });
  const { error } = await auth.verifyEmail({ email, otp });

  if (error) {
    return NextResponse.json(
      {
        error: error.error ?? "AUTH_VERIFY_EMAIL_FAILED",
        message: error.message ?? "Unable to verify email.",
      },
      { status: error.statusCode ?? 400 },
    );
  }

  return NextResponse.json({ success: true });
}
