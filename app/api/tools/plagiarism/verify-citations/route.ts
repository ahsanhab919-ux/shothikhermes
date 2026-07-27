import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";

const PLAGIARISM_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";
const MAX_CITATIONS = 50;
const MAX_SOURCE_URLS = 100;

export async function POST(req: NextRequest) {
  const identifier = getRateLimitKey(req, "citation-verify");
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 15,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  let body: { citations?: unknown[]; source_urls?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { citations, source_urls } = body;

  if (!citations || !Array.isArray(citations) || citations.length === 0) {
    return NextResponse.json(
      { error: "citations array is required and must not be empty" },
      { status: 400 }
    );
  }

  if (citations.length > MAX_CITATIONS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CITATIONS} citations per request` },
      { status: 400 }
    );
  }

  if (source_urls && source_urls.length > MAX_SOURCE_URLS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SOURCE_URLS} source URLs per request` },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${PLAGIARISM_ENGINE_URL}/verify-citations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citations, source_urls: source_urls || [] }),
      signal: AbortSignal.timeout(45_000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorBody = await response.text().catch(() => "");
    logger.warn(
      `Plagiarism engine upstream error ${response.status}: ${errorBody.slice(0, 200)}`
    );

    return NextResponse.json(
      { error: "Citation verification service error", detail: errorBody.slice(0, 200) },
      { status: response.status >= 500 ? 502 : response.status }
    );
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Citation verification timed out" },
        { status: 504 }
      );
    }

    logger.error("Citation verification fetch failed:", err?.message ?? err);

    return NextResponse.json(
      { error: "Citation verification service unavailable", detail: err?.message },
      { status: 502 }
    );
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
