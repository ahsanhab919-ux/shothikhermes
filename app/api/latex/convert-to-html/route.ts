import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function POST(request: NextRequest) {
  try {
    const identifier = request.headers.get("authorization") || request.headers.get("x-forwarded-for") || "anonymous";
    const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
      windowMs: 60_000,
      maxRequests: 20,
    });
    if (!allowed) {
      return rateLimitResponse(remaining, resetAt);
    }

    const { latex } = await request.json();
    if (!latex) {
      return NextResponse.json({ error: "LaTeX is required" }, { status: 400 });
    }
    const html = `<div class="latex-content"><pre>${latex}</pre></div>`;
    return NextResponse.json({ html, orientation: "portrait" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert LaTeX to HTML" }, { status: 500 });
  }
}
