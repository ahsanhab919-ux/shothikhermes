import type {
  Citation,
  Language,
  PlagiarismFlags,
  PlagiarismReport,
  PlagiarismSection,
  PlagiarismSource,
  PlagiarismSummary,
  RawPlagiarismResponse,
  RiskLevel,
} from "@/types/plagiarism";

/**
 * Convert similarity value (0-1 or 0-100) to percentage (0-100)
 */
const mapScore = (similarity: number | null | undefined): number => {
  if (typeof similarity !== "number" || Number.isNaN(similarity)) return 0;
  if (similarity > 1) {
    return Math.round(Math.max(0, Math.min(similarity, 100)));
  }
  return Math.round(Math.max(0, Math.min(similarity * 100, 100)));
};

/**
 * Map risk level string to RiskLevel type
 */
const mapRiskLevel = (risk?: string): RiskLevel => {
  const normalized = (risk ?? "").toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "LOW" || normalized === "MINIMAL") return "LOW";
  return "MEDIUM";
};

/**
 * Map sections array
 */
const mapSections = (
  sections?: RawPlagiarismResponse["paraphrasedSections"],
): PlagiarismSection[] => {
  if (!sections) return [];
  return sections.map((section) => ({
    similarity: mapScore(section?.similarity),
    excerpt: section?.text ?? "",
    span: {
      start: section?.startChar ?? null,
      end: section?.endChar ?? null,
    },
    sources:
      section?.sources?.map((source) => ({
        title: source?.title ?? "Unknown source",
        url: source?.url ?? "",
        snippet: source?.snippet ?? "",
        matchType: source?.matchType ?? "paraphrased",
        confidence: (source?.confidence ?? "unknown").toLowerCase(),
        similarity: mapScore(source?.similarity),
        isPlagiarism: Boolean(source?.isPlagiarism),
        reason: source?.reason ?? "",
      })) ?? [],
  }));
};

/**
 * Map sources array
 */
const mapSources = (
  sources?: RawPlagiarismResponse["sources"],
): PlagiarismSource[] => {
  if (!sources) return [];
  return sources.map((source) => ({
    title: source?.title ?? "Unknown source",
    url: source?.url ?? "",
    snippet: source?.snippet ?? "",
    matchType: source?.matchType ?? "paraphrased",
    confidence: (source?.confidence ?? "unknown").toLowerCase(),
    similarity: mapScore(source?.similarity),
    isPlagiarism: Boolean(source?.isPlagiarism),
    reason: source?.reason ?? "",
  }));
};

/**
 * Map citations array
 */
const mapCitations = (
  citations?: RawPlagiarismResponse["citations"],
): Citation[] => {
  if (!citations) return [];
  return citations.map((citation) => ({
    url: citation?.url ?? "",
    apa: citation?.apa ?? "",
    mla: citation?.mla ?? "",
    chicago: citation?.chicago ?? "",
  }));
};

/**
 * Map language object
 */
const mapLanguage = (
  language?: RawPlagiarismResponse["language"],
): Language | undefined => {
  if (!language) return undefined;
  return {
    code: language.code ?? "eng",
    name: language.name ?? "Unknown",
    confidence: language.confidence ?? 1,
  };
};

/**
 * Map summary data
 */
const mapSummary = (raw: RawPlagiarismResponse): PlagiarismSummary => {
  const sections = mapSections(raw.paraphrasedSections);
  return {
    totalChunks: raw.summary?.totalChunks ?? sections.length,
    paraphrasedCount: raw.summary?.paraphrasedCount ?? sections.length,
    paraphrasedPercentage:
      raw.paraphrasedPercentage !== undefined
        ? mapScore(raw.paraphrasedPercentage)
        : sections.length > 0
          ? Math.round(
              (sections.length /
                (raw.summary?.totalChunks ?? sections.length)) *
                100,
            )
          : 0,
    exactMatchCount: raw.summary?.exactMatchCount ?? 0,
  };
};

/**
 * Map flags
 */
const mapFlags = (raw: RawPlagiarismResponse): PlagiarismFlags => {
  const score = mapScore(raw.overallSimilarity);
  return {
    hasPlagiarism: Boolean(raw.hasPlagiarism ?? score >= 70),
    needsReview: Boolean(raw.needsReview ?? score >= 50),
  };
};

/**
 * Maps raw API response to normalized PlagiarismReport
 */
export const mapToReport = (raw: RawPlagiarismResponse): PlagiarismReport => {
  const sections = mapSections(raw.paraphrasedSections);
  const score = mapScore(raw.overallSimilarity);

  return {
    score,
    riskLevel: mapRiskLevel(raw.summary?.riskLevel),
    analyzedAt: raw.timestamp ?? new Date().toISOString(),
    sections,
    exactMatches: mapSections(raw.exactMatches),
    summary: mapSummary(raw),
    flags: mapFlags(raw),
    sources: mapSources(raw.sources),
    citations: mapCitations(raw.citations),
    language: mapLanguage(raw.language),
    exactPlagiarismPercentage: mapScore(raw.exactPlagiarismPercentage),
    analysisId: raw.analysisId,
    isLocalAnalysis: raw.is_fallback ?? false,
  };
};
