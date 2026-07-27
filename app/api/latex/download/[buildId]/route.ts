import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimiter";

const BUILD_DIR = "/tmp/writing-studio-builds";

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
  const pdfPath = path.join(BUILD_DIR, `pdf_${buildId}`, "document.pdf");

  if (!existsSync(pdfPath)) {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }

  const pdfBuffer = await readFile(pdfPath);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="document.pdf"`,
    },
  });
}
