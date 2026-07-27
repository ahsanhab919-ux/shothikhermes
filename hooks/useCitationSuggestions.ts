"use client";

import { useState, useCallback, useRef } from "react";
import { searchSemanticScholar, getSemanticScholarRecommendations } from "@/lib/citation-lookup";

interface Author {
  given: string;
  family: string;
}

export interface CitationResult {
  source: string;
  paperId?: string;
  doi: string;
  title: string;
  authors: Author[];
  year: string | number;
  journal: string;
  citationCount?: number;
  abstract?: string;
  tldr?: string;
  isOpenAccess?: boolean;
  openAccessUrl?: string;
  fieldsOfStudy?: string[];
  type: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
}

interface UseCitationSuggestionsReturn {
  suggestions: CitationResult[];
  isSearching: boolean;
  searchQuery: string;
  searchPapers: (query: string) => Promise<void>;
  getSimilarPapers: (paperId: string) => Promise<void>;
  suggestFromText: (text: string) => Promise<void>;
  clearSuggestions: () => void;
}

function extractKeyPhrases(text: string): string {
  const cleaned = text
    .replace(/\([^)]*\d{4}[^)]*\)/g, "")
    .replace(/\[\d+(?:\s*[,\-–]\s*\d+)*\]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\b(?:the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|shall|can|this|that|these|those|it|its|we|our|they|their|which|who|whom|whose|what|where|when|how|if|then|than|but|and|or|not|no|so|as|at|by|for|in|of|on|to|with|from|into|between|through|during|before|after|above|below|up|down|out|off|over|under|also|very|often|however|too|usually|really|already|still|just|more|most)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = cleaned.split(" ").filter((w) => w.length > 3);
  return words.slice(0, 12).join(" ");
}

export function useCitationSuggestions(): UseCitationSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<CitationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPapers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSearching(true);
    setSearchQuery(query);
    try {
      const results = await searchSemanticScholar(query, 10, signal);
      if (!signal.aborted) {
        setSuggestions(results as CitationResult[]);
      }
    } catch {
      if (!signal.aborted) {
        setSuggestions([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  const getSimilarPapers = useCallback(async (paperId: string) => {
    if (!paperId) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSearching(true);
    try {
      const results = await getSemanticScholarRecommendations(paperId, 8, signal);
      if (!signal.aborted) {
        setSuggestions(results as CitationResult[]);
      }
    } catch {
      if (!signal.aborted) {
        setSuggestions([]);
      }
    } finally {
      if (!signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  const suggestFromText = useCallback(async (text: string) => {
    if (!text || text.trim().length < 30) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const keyPhrases = extractKeyPhrases(text);
      if (keyPhrases.length < 10) return;

      await searchPapers(keyPhrases);
    }, 800);
  }, [searchPapers]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setSearchQuery("");
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return {
    suggestions,
    isSearching,
    searchQuery,
    searchPapers,
    getSimilarPapers,
    suggestFromText,
    clearSuggestions,
  };
}

export default useCitationSuggestions;
