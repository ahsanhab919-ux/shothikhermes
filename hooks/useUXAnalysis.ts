'use client';

import { useState, useEffect, useRef } from 'react';
import { analyzeUX, type UXAnalysisResult } from '@/lib/ux-agent-engine';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function useUXAnalysis(content: string): UXAnalysisResult | null {
  const [result, setResult] = useState<UXAnalysisResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setResult(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const plain = stripHtml(content);
      if (plain.length === 0) {
        setResult({
          readabilityScore: 100,
          gradeLevel: 'Grade 5',
          issues: [],
          wordCount: 0,
          sentenceCount: 0,
          avgWordsPerSentence: 0,
        });
      } else {
        setResult(analyzeUX(content));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content]);

  return result;
}
