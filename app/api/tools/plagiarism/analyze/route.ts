import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const EXTERNAL_PLAGIARISM_API = process.env.PLAGIARISM_API_URL || "https://api-qa.shothik.ai";
const EXTERNAL_ENDPOINT = "/api/tools/plagiarism/analyze";
const FALLBACK_ENGINE_URL = process.env.PLAGIARISM_ENGINE_URL || "http://localhost:8000";
const MAX_TEXT_LENGTH = 50_000;

function isRetryableError(status: number): boolean {
  return status >= 500 || status === 408;
}

async function tryFallbackEngine(
  text: string,
  options?: Record<string, unknown>
): Promise<Response | null> {
  try {
    const response = await fetch(`${FALLBACK_ENGINE_URL}/analyze-local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, options }),
      signal: AbortSignal.timeout(45_000),
    });
    if (response.ok) {
      return response;
    }
    logger.warn(`Fallback engine returned ${response.status}`);
    return null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Fallback engine unreachable: ${message}`);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const usageCheck = await enforceUsageLimit(req, "plagiarism");
  if (!usageCheck.allowed && usageCheck.response) {
    return usageCheck.response;
  }

  if (usageCheck.userId) {
    const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "plagiarism");
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }
  } else {
    const identifier = getRateLimitKey(req, "plagiarism-analyze");
    const { allowed, remaining, resetAt } = await checkRateLimit(identifier, { windowMs: 60_000, maxRequests: 10 });
    if (!allowed) {
      return rateLimitResponse(remaining, resetAt);
    }
  }

  let body: { text?: string; options?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, options } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text field is required" }, { status: 400 });
  }

  if (text.trim().length < 20) {
    return NextResponse.json({ error: "Text must be at least 20 characters" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters. Please use file upload for longer documents.` },
      { status: 400 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const forwardHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authHeader) forwardHeaders["Authorization"] = authHeader;

  let shouldFallback = false;
  let externalErrorDetail = "";

  try {
    const response = await fetch(`${EXTERNAL_PLAGIARISM_API}${EXTERNAL_ENDPOINT}`, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify({ text, options }),
      signal: AbortSignal.timeout(60_000),
    });

    if (response.ok) {
      if (usageCheck.userId) {
        await recordToolUsage(usageCheck.userId, "plagiarism");
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorBody = await response.text().catch(() => "");
    logger.warn(`Plagiarism API upstream error ${response.status}: ${errorBody.slice(0, 200)}`);

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: "Unauthorized", detail: errorBody }, { status: response.status });
    }
    if (response.status === 429) {
      return NextResponse.json({ error: "Rate limit exceeded. Please try again shortly." }, { status: 429 });
    }

    if (isRetryableError(response.status)) {
      shouldFallback = true;
      externalErrorDetail = `External API returned ${response.status}`;
    } else {
      return NextResponse.json(
        { error: "Plagiarism service temporarily unavailable", detail: errorBody.slice(0, 200) },
        { status: 502 }
      );
    }
  } catch (err: unknown) {
    const errObj = err as { name?: string; message?: string };
    if (errObj?.name === "TimeoutError") {
      shouldFallback = true;
      externalErrorDetail = "External API timed out";
    } else {
      shouldFallback = true;
      externalErrorDetail = `Connection failed: ${errObj?.message || "unknown"}`;
    }
    logger.warn(`External plagiarism API failed, attempting fallback: ${externalErrorDetail}`);
  }

  if (shouldFallback) {
    logger.info(`Attempting fallback analysis: ${externalErrorDetail}`);
    const fallbackResponse = await tryFallbackEngine(text, options);

    if (fallbackResponse) {
      if (usageCheck.userId) {
        await recordToolUsage(usageCheck.userId, "plagiarism");
      }
      const data = await fallbackResponse.json();
      data.is_fallback = true;
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Plagiarism service temporarily unavailable", detail: externalErrorDetail },
      { status: 502 }
    );
  }

  return NextResponse.json(
    { error: "Could not reach plagiarism service" },
    { status: 502 }
  );
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
