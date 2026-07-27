import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { verifyAuthToken } from "@/lib/api-middleware";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  const identifier = getRateLimitKey(req, "source-session");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 15,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const user = await verifyAuthToken(req);
  const userId = user?.userId || "";

  try {
    const response = await fetch(`${PLAGIARISM_ENGINE_URL}/sources/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(userId && { "X-User-Id": userId }),
      },
      body: JSON.stringify({ name: body.name.trim() }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorBody = await response.text().catch(() => "");
    return NextResponse.json(
      { error: "Session creation failed", detail: errorBody.slice(0, 200) },
      { status: response.status >= 500 ? 502 : response.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Session creation failed: ${message}`);
    return NextResponse.json({ error: "Session service unavailable" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const identifier = getRateLimitKey(req, "source-sessions-list");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  const user = await verifyAuthToken(req);
  const userId = user?.userId || "";

  try {
    const response = await fetch(`${PLAGIARISM_ENGINE_URL}/sources/sessions`, {
      signal: AbortSignal.timeout(10_000),
      headers: userId ? { "X-User-Id": userId } : {},
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Could not list sessions" }, { status: 502 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`List sessions failed: ${message}`);
    return NextResponse.json({ error: "Session service unavailable" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
