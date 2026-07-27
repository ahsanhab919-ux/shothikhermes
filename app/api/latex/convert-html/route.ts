import { NextRequest, NextResponse } from "next/server";
import { htmlToLatex } from "@/lib/writing-studio/htmlToLatex";
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

    const { html, styles } = await request.json();
    if (!html) {
      return NextResponse.json({ error: "HTML is required" }, { status: 400 });
    }
    const latex = htmlToLatex(html, styles);
    return NextResponse.json({ latex });
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert HTML to LaTeX" }, { status: 500 });
  }
}
