import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const base = req.nextUrl.origin;
  return NextResponse.redirect(`${base}/api/agent/skill`, { status: 302 });
}
