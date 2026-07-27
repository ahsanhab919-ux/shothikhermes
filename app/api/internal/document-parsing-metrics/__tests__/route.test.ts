import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/document-parsing/metrics", () => ({
  getDocumentParsingMetricsSnapshot: vi.fn(),
}));

vi.mock("@/lib/document-parsing/config", () => ({
  getLiteParseMode: vi.fn(),
}));

vi.mock("@/lib/document-parsing/comparison-samples", () => ({
  getParserComparisonSamples: vi.fn(),
}));

import { getDocumentParsingMetricsSnapshot } from "@/lib/document-parsing/metrics";
import { getLiteParseMode } from "@/lib/document-parsing/config";
import { getParserComparisonSamples } from "@/lib/document-parsing/comparison-samples";
import { GET } from "../route";

const mockedGetMetrics = vi.mocked(getDocumentParsingMetricsSnapshot);
const mockedGetMode = vi.mocked(getLiteParseMode);
const mockedGetSamples = vi.mocked(getParserComparisonSamples);

describe("GET /api/internal/document-parsing-metrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("returns document parsing metrics in development", async () => {
    mockedGetMode.mockReturnValue("shadow");
    mockedGetMetrics.mockReturnValue({
      collectedAt: Date.now(),
      uptimeMs: 1000,
      counters: {
        "pdf_extract.shadow_runs": { count: 4, lastOccurred: Date.now() },
      },
      gauges: {
        "pdf_extract.shadow_last_text_length_delta": {
          value: 120,
          lastUpdated: Date.now(),
        },
      },
    });
    mockedGetSamples.mockReturnValue([
      {
        recordedAt: Date.now(),
        fileName: "example.pdf",
        fileSize: 1024,
        baselineParser: "pdf-parse",
        candidateParser: "liteparse",
        baselinePages: 1,
        candidatePages: 1,
        baselineImageBased: false,
        candidateImageBased: false,
        baselineTextLength: 100,
        candidateTextLength: 120,
        baselineBlockCount: 0,
        candidateBlockCount: 2,
        textLengthDelta: 20,
        pageDelta: 0,
        blockCountDelta: 2,
        imageBasedMismatch: false,
        baselinePreview: "baseline",
        candidatePreview: "candidate",
      },
    ]);

    vi.stubEnv("NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED", "true");
    vi.stubEnv("LITEPARSE_ENABLED", "true");

    const req = new NextRequest("http://localhost:3000/api/internal/document-parsing-metrics");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.parserMode).toBe("shadow");
    expect(data.featureFlags.extractPdfV2Enabled).toBe(true);
    expect(data.metrics.counters["pdf_extract.shadow_runs"].count).toBe(4);
    expect(data.samples).toHaveLength(1);
    expect(data.samples[0].fileName).toBe("example.pdf");
  });

  it("requires admin key outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("METRICS_ADMIN_KEY", "secret");

    const req = new NextRequest("http://localhost:3000/api/internal/document-parsing-metrics");
    const response = await GET(req);

    expect(response.status).toBe(401);
  });
});
