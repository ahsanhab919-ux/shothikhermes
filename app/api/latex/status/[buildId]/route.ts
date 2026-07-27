import { NextRequest, NextResponse } from "next/server";
import { getBuildWithConvexFallback } from "@/lib/writing-studio/buildStore";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const identifier = request.headers.get("authorization") || request.headers.get("x-forwarded-for") || "anonymous";
  const { allowed, remaining, resetAt } = await checkRateLimit(identifier, {
    windowMs: 60_000,
    maxRequests: 20,
  });
  if (!allowed) {
    return rateLimitResponse(remaining, resetAt);
  }

  const { buildId } = await params;

  const build = await getBuildWithConvexFallback(buildId);

  if (!build) {
    return NextResponse.json({ error: "Build not found" }, { status: 404 });
  }

  return NextResponse.json({
    buildId: build.buildId,
    status: build.status,
    pdfUrl: build.pdfUrl,
    error: build.error,
    updatedAt: build.updatedAt,
  });
}
