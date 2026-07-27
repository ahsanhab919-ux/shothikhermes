import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { verifyAuthToken } from "@/lib/api-middleware";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const identifier = getRateLimitKey(req, "analyze-against-sources");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  let body: { text?: string; session_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.text || typeof body.text !== "string" || body.text.trim().length < 20) {
    return NextResponse.json({ error: "text must be at least 20 characters" }, { status: 400 });
  }

  if (!body.session_id || typeof body.session_id !== "string") {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const user = await verifyAuthToken(req);
  const userId = user?.userId || "";

  try {
    const response = await fetch(`${PLAGIARISM_ENGINE_URL}/analyze-against-sources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "X-User-Id": userId }),
      },
      body: JSON.stringify({
        text: body.text,
        session_id: body.session_id,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (response.status === 404) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const errorBody = await response.text().catch(() => "");
    logger.warn(`Analyze-against-sources error ${response.status}: ${errorBody.slice(0, 200)}`);
    return NextResponse.json(
      { error: "Analysis service error", detail: errorBody.slice(0, 200) },
      { status: response.status >= 500 ? 502 : response.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Analysis timed out" }, { status: 504 });
    }
    logger.error(`Analyze-against-sources failed: ${message}`);
    return NextResponse.json({ error: "Analysis service unavailable" }, { status: 502 });
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
