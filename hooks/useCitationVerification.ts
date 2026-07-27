"use client";

import { useState, useCallback, useRef } from "react";
import type { DetectedCitation, ReferenceEntry } from "@/services/citationDetector";

export type VerificationStatus =
  | "verified"
  | "unverified"
  | "dead"
  | "retracted"
  | "unverifiable"
  | "pending";

export interface CitationVerificationResult {
  index: number;
  citation_text: string;
  status: VerificationStatus;
  doi?: string | null;
  resolved_title?: string | null;
  resolved_authors?: string[];
  resolved_journal?: string | null;
  resolved_year?: number | null;
  resolved_url?: string | null;
  is_retracted?: boolean;
  url_alive?: boolean | null;
  url_status_code?: number | null;
  error?: string | null;
}

export interface URLVerificationResult {
  url: string;
  alive: boolean;
  status_code?: number | null;
  final_url?: string | null;
  error?: string | null;
}

export interface VerificationSummary {
  total_citations: number;
  verified: number;
  unverified: number;
  dead: number;
  retracted: number;
  unverifiable: number;
  total_source_urls: number;
  source_urls_alive: number;
  source_urls_dead: number;
}

export interface VerificationState {
  loading: boolean;
  results: CitationVerificationResult[];
  sourceURLResults: URLVerificationResult[];
  summary: VerificationSummary | null;
  error: string | null;
  processingTimeMs: number | null;
}

export function useCitationVerification() {
  const [state, setState] = useState<VerificationState>({
    loading: false,
    results: [],
    sourceURLResults: [],
    summary: null,
    error: null,
    processingTimeMs: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const verify = useCallback(
    async (
      citations: DetectedCitation[],
      references: ReferenceEntry[],
      sourceUrls?: string[]
    ) => {
      if (citations.length === 0) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        loading: true,
        error: null,
        results: citations.map((c, i) => ({
          index: i,
          citation_text: c.text,
          status: "pending" as VerificationStatus,
        })),
        sourceURLResults: [],
        summary: null,
        processingTimeMs: null,
      });

      try {
        const citationPayload = citations.map((c) => {
          const matchedRef = references.find((ref) => {
            if (c.year && ref.year && c.year !== ref.year) return false;
            if (c.authors && ref.authors) {
              const surname = c.authors.split(/\s/)[0].replace(/,/, "");
              return ref.authors.includes(surname);
            }
            if (c.doi && ref.doi) return c.doi === ref.doi;
            return false;
          });

          return {
            text: c.text,
            style: c.style,
            doi: c.doi || matchedRef?.doi || undefined,
            url: c.url || matchedRef?.url || undefined,
            authors: c.authors || matchedRef?.authors || undefined,
            year: c.year || matchedRef?.year || undefined,
            title: matchedRef?.title || undefined,
          };
        });

        const response = await fetch("/api/tools/plagiarism/verify-citations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            citations: citationPayload,
            source_urls: sourceUrls || [],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Verification failed (${response.status})`
          );
        }

        const data = await response.json();

        setState({
          loading: false,
          results: data.citations || [],
          sourceURLResults: data.source_urls || [],
          summary: data.summary || null,
          error: null,
          processingTimeMs: data.processing_time_ms || null,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;

        setState({
          loading: false,
          results: [],
          sourceURLResults: [],
          summary: null,
          error:
            err instanceof Error
              ? err.message
              : "Citation verification failed",
          processingTimeMs: null,
        });
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      loading: false,
      results: [],
      sourceURLResults: [],
      summary: null,
      error: null,
      processingTimeMs: null,
    });
  }, []);

  return {
    ...state,
    verify,
    reset,
  };
}
