import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { verifyAuthToken } from "@/lib/api-middleware";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const identifier = getRateLimitKey(req, "source-session-papers");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  let body: { papers?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.papers || !Array.isArray(body.papers) || body.papers.length === 0) {
    return NextResponse.json({ error: "papers array is required" }, { status: 400 });
  }

  const user = await verifyAuthToken(req);
  const userId = user?.userId || "";

  try {
    const response = await fetch(
      `${PLAGIARISM_ENGINE_URL}/sources/session/${sessionId}/papers`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(userId && { "X-User-Id": userId }),
        },
        body: JSON.stringify({ papers: body.papers }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (response.status === 404) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }

    const errorBody = await response.text().catch(() => "");
    return NextResponse.json(
      { error: "Could not add papers", detail: errorBody.slice(0, 200) },
      { status: response.status >= 500 ? 502 : response.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Add papers failed: ${message}`);
    return NextResponse.json({ error: "Session service unavailable" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
