'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

interface GhostTextResult {
  suggestion: string | null;
  isLoading: boolean;
  accept: (editor: Editor | null) => void;
  dismiss: () => void;
}

export function useGhostText(content: string): GhostTextResult {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setSuggestion(null);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const accept = useCallback((editor: Editor | null) => {
    if (!editor || !suggestion) return;
    editor.chain().focus().insertContent(suggestion).run();
    setSuggestion(null);
  }, [suggestion]);

  useEffect(() => {
    setSuggestion(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsLoading(false);

    const plain = stripHtml(content);

    if (wordCount(plain) < 20) return;

    const lastChar = plain[plain.length - 1];
    if (!lastChar || /\s/.test(lastChar)) return;

    debounceRef.current = setTimeout(async () => {
      const last400 = plain.slice(-400);

      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      let fullText = '';

      try {
        const response = await fetch('/api/ai-cowriter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentText: last400,
            context: '',
            mode: 'autocomplete',
            instruction: '',
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);
              if (data.done) { reader.cancel(); break; }
              if (data.content) {
                fullText += data.content;
                if (fullText.length >= 120) {
                  reader.cancel();
                  break;
                }
              }
            } catch {
              // ignore parse errors
            }
          }

          if (fullText.length >= 120) break;
        }

        const trimmed = fullText.trim();
        if (trimmed) {
          const firstSentenceEnd = trimmed.search(/[.!?]\s/);
          const clipped =
            firstSentenceEnd > 10
              ? trimmed.slice(0, firstSentenceEnd + 1)
              : trimmed.slice(0, 120);
          setSuggestion(clipped);
        }
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    }, 1500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [content]);

  return { suggestion, isLoading, accept, dismiss };
}
