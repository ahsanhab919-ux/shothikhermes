import type { PlagiarismReport, PlagiarismSource } from "@/types/plagiarism";

interface LegacyResult {
  percent: number;
  source: string;
  chunkText: string;
  sources: PlagiarismSource[];
  span: { start: number | null; end: number | null };
}

interface LegacyFormat {
  score: number | null;
  results: LegacyResult[];
}

/**
 * Adapts modern PlagiarismReport to legacy format
 * Used for backward compatibility with existing components
 */
export const adaptToLegacy = (
  report: PlagiarismReport | null,
): LegacyFormat => {
  if (!report) {
    return { score: null, results: [] };
  }

  return {
    score: report.score,
    results: report.sections.map((section) => ({
      percent: section.similarity,
      source: section.sources?.[0]?.title ?? "Unknown source",
      chunkText: section.excerpt,
      sources: section.sources,
      span: section.span,
    })),
  };
};

/**
 * Check if report has legacy-compatible data
 */
export const isLegacyCompatible = (
  report: PlagiarismReport | null,
): boolean => {
  if (!report) return false;
  return report.sections.length > 0 || report.score !== null;
};
