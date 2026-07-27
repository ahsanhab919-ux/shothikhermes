import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/document-parsing/pdfParseExtractor", () => ({
  parsePdfWithPdfParse: vi.fn(),
}));

vi.mock("@/lib/document-parsing/liteParseExtractor", () => ({
  parsePdfWithLiteParse: vi.fn(),
}));

vi.mock("@/lib/runtime-metrics", () => ({
  incrementCounter: vi.fn(),
  setGauge: vi.fn(),
  maybeLogMetrics: vi.fn(),
}));

vi.mock("@/lib/document-parsing/comparison-samples", () => ({
  recordParserComparisonSample: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

import { recordParserComparisonSample } from "@/lib/document-parsing/comparison-samples";
import { parsePdfWithLiteParse } from "@/lib/document-parsing/liteParseExtractor";
import { parsePdfWithPdfParse } from "@/lib/document-parsing/pdfParseExtractor";
import { parsePdfDocument } from "@/lib/document-parsing";
import { logger } from "@/lib/logger";
import { incrementCounter, maybeLogMetrics, setGauge } from "@/lib/runtime-metrics";

const mockedPdfParse = vi.mocked(parsePdfWithPdfParse);
const mockedLiteParse = vi.mocked(parsePdfWithLiteParse);
const mockedLogger = vi.mocked(logger);
const mockedIncrementCounter = vi.mocked(incrementCounter);
const mockedSetGauge = vi.mocked(setGauge);
const mockedMaybeLogMetrics = vi.mocked(maybeLogMetrics);
const mockedRecordComparisonSample = vi.mocked(recordParserComparisonSample);

describe("parsePdfDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.LITEPARSE_ENABLED;
    delete process.env.LITEPARSE_MODE;
  });

  it("uses pdf-parse when LiteParse is disabled", async () => {
    mockedPdfParse.mockResolvedValue({
      parser: "pdf-parse",
      text: "baseline",
      preview: "baseline",
      title: "Doc",
      pages: 1,
      imageBased: false,
    });

    const file = new File([new Uint8Array([1, 2, 3])], "doc.pdf", { type: "application/pdf" });
    const result = await parsePdfDocument(file);

    expect(result.parser).toBe("pdf-parse");
    expect(mockedPdfParse).toHaveBeenCalledTimes(1);
    expect(mockedLiteParse).not.toHaveBeenCalled();
  });

  it("logs comparison in shadow mode and returns baseline result", async () => {
    process.env.LITEPARSE_ENABLED = "true";
    process.env.LITEPARSE_MODE = "shadow";

    mockedPdfParse.mockResolvedValue({
      parser: "pdf-parse",
      text: "baseline text",
      preview: "baseline text",
      title: "Baseline",
      pages: 2,
      imageBased: false,
      blocks: [],
    });

    mockedLiteParse.mockResolvedValue({
      parser: "liteparse",
      text: "candidate text",
      preview: "candidate text",
      title: "Candidate",
      pages: 2,
      imageBased: false,
      blocks: [{ type: "paragraph", text: "candidate text" }],
    });

    const file = new File([new Uint8Array([1, 2, 3])], "doc.pdf", { type: "application/pdf" });
    const result = await parsePdfDocument(file);

    await Promise.resolve();

    expect(result.parser).toBe("pdf-parse");
    expect(mockedLiteParse).toHaveBeenCalledTimes(1);
    expect(mockedIncrementCounter).toHaveBeenCalledWith("pdf_extract.shadow_runs");
    expect(mockedSetGauge).toHaveBeenCalledWith(
      "pdf_extract.shadow_last_text_length_delta",
      expect.any(Number),
    );
    expect(mockedSetGauge).toHaveBeenCalledWith(
      "pdf_extract.shadow_last_page_delta",
      expect.any(Number),
    );
    expect(mockedSetGauge).toHaveBeenCalledWith(
      "pdf_extract.shadow_last_block_count_delta",
      expect.any(Number),
    );
    expect(mockedMaybeLogMetrics).toHaveBeenCalled();
    expect(mockedRecordComparisonSample).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "doc.pdf",
        baselineParser: "pdf-parse",
        candidateParser: "liteparse",
      }),
    );
    expect(mockedLogger.info).toHaveBeenCalledWith(
      "extract-pdf-v2 parser comparison",
      expect.objectContaining({
        baselineParser: "pdf-parse",
        candidateParser: "liteparse",
        fileName: "doc.pdf",
      }),
    );
  });

  it("uses LiteParse in primary mode and falls back on failure", async () => {
    process.env.LITEPARSE_ENABLED = "true";
    process.env.LITEPARSE_MODE = "primary";

    mockedPdfParse.mockResolvedValue({
      parser: "pdf-parse",
      text: "baseline text",
      preview: "baseline text",
      title: "Baseline",
      pages: 1,
      imageBased: false,
    });

    mockedLiteParse.mockRejectedValue(new Error("LiteParse failed"));
    const file = new File([new Uint8Array([1, 2, 3])], "doc.pdf", { type: "application/pdf" });
    const result = await parsePdfDocument(file);

    expect(result.parser).toBe("pdf-parse");
    expect(mockedIncrementCounter).toHaveBeenCalledWith("pdf_extract.primary_attempts");
    expect(mockedIncrementCounter).toHaveBeenCalledWith("pdf_extract.primary_fallbacks");
    expect(mockedLogger.warn).toHaveBeenCalled();
  });
});
