import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import { checkRateLimit, getRateLimitKey, rateLimitResponse } from "@/lib/rateLimiter";
import { enforceUsageLimit, recordToolUsage } from "@/lib/usage-enforcement";
import { checkTieredToolRateLimit } from "@/lib/tool-rate-limiter";

const EXTERNAL_PLAGIARISM_API = process.env.PLAGIARISM_API_URL || "https://api-qa.shothik.ai";
const EXTERNAL_ENDPOINT = "/api/tools/plagiarism/analyze-file";

export async function POST(req: NextRequest) {
  const usageCheck = await enforceUsageLimit(req, "plagiarism");
  if (!usageCheck.allowed && usageCheck.response) {
    return usageCheck.response;
  }

  if (usageCheck.userId) {
    const rateCheck = await checkTieredToolRateLimit(usageCheck.userId, usageCheck.tier ?? "free", "plagiarism-file");
    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }
  } else {
    const identifier = getRateLimitKey(req, "plagiarism-file");
    const { allowed, remaining, resetAt } = await checkRateLimit(identifier, { windowMs: 60_000, maxRequests: 5 });
    if (!allowed) {
      return rateLimitResponse(remaining, resetAt);
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file field is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const forwardHeaders: Record<string, string> = {};
    if (authHeader) forwardHeaders["Authorization"] = authHeader;

    const outForm = new FormData();
    outForm.append("file", file);

    const optionsRaw = formData.get("options");
    if (optionsRaw && typeof optionsRaw === "string") {
      outForm.append("options", optionsRaw);
    }

    const response = await fetch(`${EXTERNAL_PLAGIARISM_API}${EXTERNAL_ENDPOINT}`, {
      method: "POST",
      headers: forwardHeaders,
      body: outForm,
      signal: AbortSignal.timeout(120_000),
    });

    if (response.ok) {
      if (usageCheck.userId) {
        await recordToolUsage(usageCheck.userId, "plagiarism");
      }
      const data = await response.json();
      return NextResponse.json(data);
    }

    const errorBody = await response.text().catch(() => "");
    logger.warn(`Plagiarism file API upstream error ${response.status}: ${errorBody.slice(0, 200)}`);

    return NextResponse.json(
      { error: "Plagiarism service error", status: response.status },
      { status: 502 }
    );
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return NextResponse.json({ error: "File analysis timed out" }, { status: 504 });
    }
    logger.error("Plagiarism file analyze error:", err?.message ?? err);
    return NextResponse.json({ error: "Could not reach plagiarism service", detail: err?.message }, { status: 502 });
  }
}
