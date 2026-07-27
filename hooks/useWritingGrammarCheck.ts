'use client';

import { useState, useCallback, useRef } from 'react';

export interface WritingGrammarSuggestion {
  offset: number;
  length: number;
  message: string;
  shortMessage: string;
  replacements: string[];
  ruleId: string;
  category: string;
  context: string;
}

const LANGUAGETOOL_API = 'https://api.languagetool.org/v2/check';
const DEBOUNCE_MS = 2000;

export function useWritingGrammarCheck() {
  const [suggestions, setSuggestions] = useState<WritingGrammarSuggestion[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastCheckedRef = useRef<string>('');

  const check = useCallback((plainText: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = plainText.trim();
    if (trimmed.length < 30 || trimmed === lastCheckedRef.current) return;

    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsChecking(true);
      try {
        const body = new URLSearchParams({
          text: trimmed.substring(0, 6000),
          language: 'en-US',
          disabledRules: 'WHITESPACE_RULE,COMMA_PARENTHESIS_WHITESPACE,EN_QUOTES',
        });

        const res = await fetch(LANGUAGETOOL_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Grammar check failed');

        const data = await res.json();
        lastCheckedRef.current = trimmed;

        const matches: WritingGrammarSuggestion[] = (data.matches ?? [])
          .slice(0, 20)
          .map((m: any) => ({
            offset: m.offset,
            length: m.length,
            message: m.message,
            shortMessage: m.shortMessage || m.message.split('.')[0],
            replacements: (m.replacements ?? []).slice(0, 3).map((r: any) => r.value),
            ruleId: m.rule?.id ?? '',
            category: m.rule?.category?.name ?? 'Grammar',
            context: m.context?.text ?? '',
          }));

        setSuggestions(matches);
      } catch (err: any) {
        if (err.name !== 'AbortError') setSuggestions([]);
      } finally {
        setIsChecking(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const dismiss = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAll = useCallback(() => setSuggestions([]), []);

  return { suggestions, isChecking, check, dismiss, clearAll };
}
