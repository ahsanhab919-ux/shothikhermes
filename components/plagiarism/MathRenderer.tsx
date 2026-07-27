"use client";

import { useMemo, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { sanitizeHtml } from "@/lib/sanitize";

interface MathRendererProps {
  text: string;
  className?: string;
}

const MATH_SPLIT_RE = /(\$\$[\s\S]+?\$\$|\$[^\s$][^$]*?[^\s$]\$|\$[^\s$]\$)/g;

function renderKatexSafe(latex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      errorColor: "#ef4444",
      trust: false,
      strict: false,
    });
  } catch {
    return null;
  }
}

export function MathRenderer({ text, className }: MathRendererProps) {
  const elements = useMemo((): ReactNode[] | null => {
    if (!text || !/\$/.test(text)) return null;

    const parts = text.split(MATH_SPLIT_RE);
    if (parts.length <= 1) return null;

    const nodes: ReactNode[] = [];
    let hasMath = false;

    parts.forEach((part, i) => {
      if (!part) return;

      if (part.startsWith("$$") && part.endsWith("$$")) {
        const latex = part.slice(2, -2);
        const html = renderKatexSafe(latex, true);
        if (html) {
          hasMath = true;
          nodes.push(
            <div
              key={i}
              className="my-2 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
            />
          );
        } else {
          nodes.push(
            <code key={i} className="text-muted-foreground text-xs">
              {latex}
            </code>
          );
        }
      } else if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        const latex = part.slice(1, -1);
        const html = renderKatexSafe(latex, false);
        if (html) {
          hasMath = true;
          nodes.push(
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
            />
          );
        } else {
          nodes.push(
            <code key={i} className="text-muted-foreground text-xs">
              {latex}
            </code>
          );
        }
      } else {
        nodes.push(<span key={i}>{part}</span>);
      }
    });

    return hasMath ? nodes : null;
  }, [text]);

  if (!elements) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{elements}</span>;
}

export function hasMathContent(text: string): boolean {
  return /\$\$[\s\S]+?\$\$|\$[^\s$][^$]*?[^\s$]\$|\$[^\s$]\$/.test(text);
}
