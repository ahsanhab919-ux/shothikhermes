import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const identifier = getRateLimitKey(req, "source-search");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  let body: { query?: string; max_results?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.query || typeof body.query !== "string" || body.query.trim().length < 2) {
    return NextResponse.json({ error: "query must be at least 2 characters" }, { status: 400 });
  }

  try {
    const response = await fetch(`${PLAGIARISM_ENGINE_URL}/sources/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: body.query.trim(),
        max_results: body.max_results || 10,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorBody = await response.text().catch(() => "");
    logger.warn(`Source search upstream error ${response.status}: ${errorBody.slice(0, 200)}`);
    return NextResponse.json(
      { error: "Source search service error", detail: errorBody.slice(0, 200) },
      { status: response.status >= 500 ? 502 : response.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Source search timed out" }, { status: 504 });
    }
    logger.error(`Source search failed: ${message}`);
    return NextResponse.json({ error: "Source search service unavailable" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
