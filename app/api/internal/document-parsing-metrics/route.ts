import { NextRequest, NextResponse } from "next/server";
import { getParserComparisonSamples } from "@/lib/document-parsing/comparison-samples";
import { getDocumentParsingMetricsSnapshot } from "@/lib/document-parsing/metrics";
import { getLiteParseMode } from "@/lib/document-parsing/config";

export async function GET(request: NextRequest) {
  const isDevEnv = process.env.NODE_ENV === "development";
  const adminKey = request.headers.get("x-admin-key");
  const validAdminKey = process.env.METRICS_ADMIN_KEY;

  if (!isDevEnv && (!validAdminKey || adminKey !== validAdminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "ok",
    parserMode: getLiteParseMode(),
    featureFlags: {
      extractPdfV2Enabled: process.env.NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED === "true",
      liteParseEnabled: process.env.LITEPARSE_ENABLED === "true",
    },
    metrics: getDocumentParsingMetricsSnapshot(),
    samples: getParserComparisonSamples(),
    timestamp: new Date().toISOString(),
  });
}
