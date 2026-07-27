export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface PlagiarismSource {
  title: string;
  url: string;
  snippet: string;
  matchType: string;
  confidence: string;
  similarity: number;
  isPlagiarism: boolean;
  reason: string;
}

export interface PlagiarismSection {
  similarity: number;
  excerpt: string;
  span: {
    start: number | null;
    end: number | null;
  };
  sources: PlagiarismSource[];
}

export interface PlagiarismSummary {
  totalChunks?: number;
  paraphrasedCount: number;
  paraphrasedPercentage: number;
  exactMatchCount: number;
}

export interface PlagiarismFlags {
  hasPlagiarism: boolean;
  needsReview: boolean;
}

export interface Citation {
  url: string;
  apa: string;
  mla: string;
  chicago: string;
}

export interface Language {
  code: string;
  name: string;
  confidence: number;
}

export interface PlagiarismReport {
  score: number;
  riskLevel: RiskLevel;
  analyzedAt: string;
  sections: PlagiarismSection[];
  exactMatches?: PlagiarismSection[];
  summary: PlagiarismSummary;
  flags: PlagiarismFlags;
  sources?: PlagiarismSource[];
  citations?: Citation[];
  language?: Language;
  exactPlagiarismPercentage?: number;
  analysisId?: string;
  isLocalAnalysis?: boolean;
}

// Raw API response types (for mapper)
export interface RawPlagiarismResponse {
  overallSimilarity?: number | null;
  paraphrasedSections?: RawParaphrasedSection[];
  exactMatches?: RawParaphrasedSection[];
  summary?: {
    totalChunks?: number;
    paraphrasedCount?: number;
    exactMatchCount?: number;
    riskLevel?: string;
  };
  timestamp?: string;
  paraphrasedPercentage?: number;
  exactPlagiarismPercentage?: number;
  hasPlagiarism?: boolean;
  needsReview?: boolean;
  sources?: RawSource[];
  citations?: RawCitation[];
  language?: RawLanguage;
  analysisId?: string;
  is_fallback?: boolean;
}

export interface RawParaphrasedSection {
  text?: string;
  similarity?: number | null;
  sources?: RawSource[];
  startChar?: number;
  endChar?: number;
}

export interface RawSource {
  url?: string;
  title?: string;
  snippet?: string;
  reason?: string;
  matchType?: string;
  confidence?: string;
  isPlagiarism?: boolean;
  similarity?: number | null;
}

export interface RawCitation {
  url?: string;
  apa?: string;
  mla?: string;
  chicago?: string;
}

export interface RawLanguage {
  code?: string;
  name?: string;
  confidence?: number;
}
