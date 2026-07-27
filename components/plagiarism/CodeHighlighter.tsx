"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface CodeHighlighterProps {
  code: string;
  language?: string;
  className?: string;
}

let highlighterPromise: Promise<any> | null = null;
let cachedHighlighter: any = null;

async function getHighlighter() {
  if (cachedHighlighter) return cachedHighlighter;
  if (highlighterPromise) return highlighterPromise;

  highlighterPromise = (async () => {
    const { createHighlighter } = await import("shiki");
    const hl = await createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "python",
        "javascript",
        "typescript",
        "java",
        "c",
        "cpp",
        "r",
        "matlab",
        "latex",
        "bash",
        "sql",
        "json",
      ],
    });
    cachedHighlighter = hl;
    return hl;
  })();

  return highlighterPromise;
}

const LANG_ALIASES: Record<string, string> = {
  py: "python",
  js: "javascript",
  ts: "typescript",
  "c++": "cpp",
  tex: "latex",
  sh: "bash",
  shell: "bash",
};

function detectLanguage(code: string): string {
  if (/^\s*(def |import |from |class |print\()/.test(code)) return "python";
  if (/^\s*(function |const |let |var |=>)/.test(code)) return "javascript";
  if (/^\s*(public |private |class |void |System\.)/.test(code)) return "java";
  if (/^\s*(#include|int main|printf|scanf)/.test(code)) return "c";
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|FROM|WHERE)\b/i.test(code)) return "sql";
  if (/^\s*\\(begin|documentclass|usepackage)/.test(code)) return "latex";
  if (/^\s*(library|data\.frame|ggplot|<-)/.test(code)) return "r";
  return "text";
}

export function CodeHighlighter({
  code,
  language,
  className,
}: CodeHighlighterProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const resolvedLang = useMemo(() => {
    const lang = language?.toLowerCase() || detectLanguage(code);
    return LANG_ALIASES[lang] || lang;
  }, [language, code]);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((highlighter) => {
        if (cancelled) return;

        const loadedLangs = highlighter.getLoadedLanguages();
        const langToUse = loadedLangs.includes(resolvedLang)
          ? resolvedLang
          : "text";

        const result = highlighter.codeToHtml(code, {
          lang: langToUse,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });
        setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code, resolvedLang]);

  if (error || html === null) {
    return (
      <pre
        className={cn(
          "overflow-x-auto rounded-lg bg-muted/50 p-4 text-sm",
          className
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm",
        "dark:[&_.shiki]:!bg-zinc-900 [&_.shiki]:!bg-zinc-50",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}

export function hasCodeContent(text: string): boolean {
  return /```[\s\S]*?```|`[^`\n]+`/.test(text);
}
