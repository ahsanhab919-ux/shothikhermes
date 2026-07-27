import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { getInsforgePublicConfig } from "@/lib/insforge/config";

export async function POST() {
  const auth = createAuthActions({
    cookies: await cookies(),
    ...getInsforgePublicConfig(),
  });
  const { error } = await auth.signOut();

  if (error) {
    return NextResponse.json(
      {
        error: error.error ?? "AUTH_SIGN_OUT_FAILED",
        message: error.message ?? "Unable to sign out.",
      },
      { status: error.statusCode ?? 400 },
    );
  }

  return NextResponse.json({ success: true });
}
