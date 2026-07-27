"use client";

import { useMemo } from "react";
import { analyzeCitations, type CitationAnalysis } from "@/services/citationDetector";

interface PlagiarismSource {
  url?: string;
  title?: string;
  snippet?: string;
  matchId?: string;
  similarity?: number;
}

export function useCitationAnalysis(
  text: string,
  plagiarismSources: PlagiarismSource[] = [],
  enabled = true
): CitationAnalysis | null {
  return useMemo(() => {
    if (!enabled || !text || text.trim().length < 20) return null;

    try {
      return analyzeCitations(text, plagiarismSources);
    } catch {
      return null;
    }
  }, [text, plagiarismSources, enabled]);
}

export default useCitationAnalysis;
