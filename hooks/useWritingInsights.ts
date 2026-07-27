'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type InsightType = 'pacing' | 'citation' | 'empty-section' | 'tone-shift';

export interface Insight {
  id: string;
  type: InsightType;
  message: string;
  chapterTitle?: string;
  anchor?: string;
}

interface UseWritingInsightsOptions {
  projectType?: 'book' | 'research' | 'assignment';
  debounceMs?: number;
  maxInsights?: number;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fleschReadingEase(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length === 0 || words.length === 0) return 60;

  const syllables = words.reduce((sum, word) => {
    return sum + Math.max(1, word.toLowerCase().replace(/[^aeiou]/g, '').length);
  }, 0);

  return 206.835
    - 1.015 * (words.length / sentences.length)
    - 84.6 * (syllables / words.length);
}

function parseSections(html: string): Array<{ heading: string; body: string; wordCount: number }> {
  const result: Array<{ heading: string; body: string; wordCount: number }> = [];
  const parts = html.split(/<h[1-3][^>]*>/i);

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const headingMatch = part.match(/^(.*?)<\/h[1-3]>/i);
    if (!headingMatch) continue;
    const heading = stripHtml(headingMatch[1]).trim();
    const body = stripHtml(part.replace(headingMatch[0], '')).trim();
    result.push({ heading, body, wordCount: countWords(body) });
  }

  return result;
}

function hasFractualClaim(text: string): boolean {
  return /\d+\s*%|\d+\s*(million|billion|thousand)|according to|studies show|research (shows|suggests|indicates|finds)|data (shows|suggests)|evidence (suggests|shows)/i.test(text);
}

function hasCitationMarker(text: string): boolean {
  return /\[[\w\s,\.]+\d{4}\]|\([\w\s,\.]+\d{4}\)|\[\d+\]/.test(text);
}

export function useWritingInsights(
  content: string,
  {
    projectType = 'book',
    debounceMs = 5000,
    maxInsights = 3,
  }: UseWritingInsightsOptions = {}
): Insight[] {
  const [insights, setInsights] = useState<Insight[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  const analyze = useCallback(() => {
    const html = contentRef.current;
    if (!html || html.length < 100) {
      setInsights([]);
      return;
    }

    const found: Insight[] = [];
    const sections = parseSections(html);

    for (const section of sections) {
      if (found.length >= maxInsights) break;
      if (section.wordCount > 0 && section.wordCount < 200) {
        found.push({
          id: `pacing-${section.heading}`,
          type: 'pacing',
          message: `"${section.heading}" is very short (${section.wordCount} words). Consider expanding this section for better depth.`,
          chapterTitle: section.heading,
          anchor: section.heading,
        });
      }
    }

    for (const section of sections) {
      if (found.length >= maxInsights) break;
      if (section.wordCount === 0) {
        found.push({
          id: `empty-${section.heading}`,
          type: 'empty-section',
          message: `"${section.heading}" is empty. Add content to this section.`,
          chapterTitle: section.heading,
          anchor: section.heading,
        });
      }
    }

    if (found.length < maxInsights && (projectType === 'research' || projectType === 'assignment')) {
      const plain = stripHtml(html);
      const paragraphs = plain.split(/\n+/).filter(p => p.trim().length > 60);
      for (const para of paragraphs) {
        if (found.length >= maxInsights) break;
        if (hasFractualClaim(para) && !hasCitationMarker(para)) {
          const preview = para.slice(0, 60) + (para.length > 60 ? '…' : '');
          found.push({
            id: `citation-${preview.slice(0, 20)}`,
            type: 'citation',
            message: `Uncited claim: "${preview}" — add a citation marker.`,
          });
        }
      }
    }

    if (found.length < maxInsights && sections.length >= 3) {
      const scored = sections
        .filter(s => s.wordCount >= 40)
        .map(s => ({ heading: s.heading, score: fleschReadingEase(s.body) }));

      if (scored.length >= 3) {
        const avg = scored.reduce((s, x) => s + x.score, 0) / scored.length;
        for (const s of scored) {
          if (found.length >= maxInsights) break;
          if (Math.abs(s.score - avg) > 25) {
            const direction = s.score > avg ? 'more informal' : 'more formal';
            found.push({
              id: `tone-${s.heading}`,
              type: 'tone-shift',
              message: `"${s.heading}" reads ${direction} than the rest of your document. Consider adjusting the tone for consistency.`,
              chapterTitle: s.heading,
              anchor: s.heading,
            });
          }
        }
      }
    }

    setInsights(found.slice(0, maxInsights));
  }, [projectType, maxInsights]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(analyze, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, analyze, debounceMs]);

  return insights;
}
