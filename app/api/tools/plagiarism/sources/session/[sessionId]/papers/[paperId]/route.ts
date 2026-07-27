import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { verifyAuthToken } from "@/lib/api-middleware";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; paperId: string }> }
) {
  const { sessionId, paperId } = await params;
  const identifier = getRateLimitKey(req, "source-session-paper-delete");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  const user = await verifyAuthToken(req);
  const userId = user?.userId || "";
  const encodedPaperId = encodeURIComponent(paperId);

  try {
    const response = await fetch(
      `${PLAGIARISM_ENGINE_URL}/sources/session/${sessionId}/papers/${encodedPaperId}`,
      {
        method: "DELETE",
        signal: AbortSignal.timeout(10_000),
        headers: userId ? { "X-User-Id": userId } : {},
      }
    );

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (response.status === 404) {
      return NextResponse.json({ error: "Session or paper not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Could not remove paper" }, { status: 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Remove paper failed: ${message}`);
    return NextResponse.json({ error: "Session service unavailable" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
