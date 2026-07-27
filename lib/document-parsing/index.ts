import { getLiteParseMode } from "@/lib/document-parsing/config";
import { parsePdfWithLiteParse } from "@/lib/document-parsing/liteParseExtractor";
import { parsePdfWithPdfParse } from "@/lib/document-parsing/pdfParseExtractor";
import { ParsedDocumentResult } from "@/lib/document-parsing/types";
import { recordParserComparisonSample } from "@/lib/document-parsing/comparison-samples";
import { logger } from "@/lib/logger";
import { incrementCounter, maybeLogMetrics, setGauge } from "@/lib/runtime-metrics";

function logParserComparison(
  baseline: ParsedDocumentResult,
  candidate: ParsedDocumentResult,
  file: File,
) {
  const baselineTextLength = baseline.text.length;
  const candidateTextLength = candidate.text.length;
  const textLengthDelta = candidateTextLength - baselineTextLength;
  const pageDelta = candidate.pages - baseline.pages;
  const blockCountDelta = (candidate.blocks?.length ?? 0) - (baseline.blocks?.length ?? 0);
  const imageBasedMismatch = baseline.imageBased !== candidate.imageBased;

  incrementCounter("pdf_extract.shadow_runs");
  if (imageBasedMismatch) {
    incrementCounter("pdf_extract.shadow_image_based_mismatch");
  }
  if (candidateTextLength > baselineTextLength) {
    incrementCounter("pdf_extract.shadow_candidate_longer_text");
  }
  if (candidateTextLength < baselineTextLength) {
    incrementCounter("pdf_extract.shadow_candidate_shorter_text");
  }

  setGauge("pdf_extract.shadow_last_text_length_delta", textLengthDelta);
  setGauge("pdf_extract.shadow_last_page_delta", pageDelta);
  setGauge("pdf_extract.shadow_last_block_count_delta", blockCountDelta);
  maybeLogMetrics();

  recordParserComparisonSample({
    recordedAt: Date.now(),
    fileName: file.name,
    fileSize: file.size,
    baselineParser: baseline.parser,
    candidateParser: candidate.parser,
    baselinePages: baseline.pages,
    candidatePages: candidate.pages,
    baselineImageBased: baseline.imageBased,
    candidateImageBased: candidate.imageBased,
    baselineTextLength,
    candidateTextLength,
    baselineBlockCount: baseline.blocks?.length ?? 0,
    candidateBlockCount: candidate.blocks?.length ?? 0,
    textLengthDelta,
    pageDelta,
    blockCountDelta,
    imageBasedMismatch,
    baselinePreview: baseline.preview.slice(0, 80),
    candidatePreview: candidate.preview.slice(0, 80),
  });

  logger.info("extract-pdf-v2 parser comparison", {
    fileName: file.name,
    fileSize: file.size,
    baselineParser: baseline.parser,
    candidateParser: candidate.parser,
    baselinePages: baseline.pages,
    candidatePages: candidate.pages,
    baselineImageBased: baseline.imageBased,
    candidateImageBased: candidate.imageBased,
    baselineTextLength: baseline.text.length,
    candidateTextLength: candidate.text.length,
    baselinePreview: baseline.preview.slice(0, 80),
    candidatePreview: candidate.preview.slice(0, 80),
    baselineBlockCount: baseline.blocks?.length ?? 0,
    candidateBlockCount: candidate.blocks?.length ?? 0,
    textLengthDelta,
    pageDelta,
    blockCountDelta,
    imageBasedMismatch,
  });
}

export async function parsePdfDocument(file: File): Promise<ParsedDocumentResult> {
  const mode = getLiteParseMode();
  const baseline = await parsePdfWithPdfParse(file);

  if (mode === "primary") {
    try {
      incrementCounter("pdf_extract.primary_attempts");
      return await parsePdfWithLiteParse(file);
    } catch (error) {
      incrementCounter("pdf_extract.primary_fallbacks");
      logger.warn("LiteParse primary parse failed, falling back to pdf-parse", {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
      return baseline;
    }
  }

  if (mode === "shadow") {
    void parsePdfWithLiteParse(file)
      .then((candidate) => {
        logParserComparison(baseline, candidate, file);
      })
      .catch((error) => {
        incrementCounter("pdf_extract.shadow_failures");
        maybeLogMetrics();
        logger.warn("LiteParse shadow parse failed", {
          fileName: file.name,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }

  return baseline;
}

export * from "@/lib/document-parsing/types";
