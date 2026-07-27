"use client";

import { useMemo } from "react";
import { MathRenderer, hasMathContent } from "./MathRenderer";
import { CodeHighlighter, hasCodeContent } from "./CodeHighlighter";
import { cn } from "@/lib/utils";

interface STEMContentRendererProps {
  text: string;
  className?: string;
}

interface ContentSegment {
  type: "text" | "display-math" | "code-block";
  content: string;
  language?: string;
}

function parseContent(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let remaining = text;

  const combinedRe = /(?:```(\w*)\n?([\s\S]*?)```|\$\$([\s\S]+?)\$\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = combinedRe.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: remaining.slice(lastIndex, match.index),
      });
    }

    if (match[2] !== undefined) {
      segments.push({
        type: "code-block",
        content: match[2].trim(),
        language: match[1] || undefined,
      });
    } else if (match[3] !== undefined) {
      segments.push({
        type: "display-math",
        content: match[3],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    segments.push({
      type: "text",
      content: remaining.slice(lastIndex),
    });
  }

  return segments;
}

export function STEMContentRenderer({
  text,
  className,
}: STEMContentRendererProps) {
  const segments = useMemo(() => parseContent(text), [text]);

  const hasSpecialContent = useMemo(
    () => hasMathContent(text) || hasCodeContent(text),
    [text]
  );

  if (!hasSpecialContent) {
    return (
      <span className={cn("whitespace-pre-wrap leading-relaxed", className)}>
        {text}
      </span>
    );
  }

  return (
    <div className={cn("space-y-2 leading-relaxed", className)}>
      {segments.map((segment, i) => {
        switch (segment.type) {
          case "code-block":
            return (
              <CodeHighlighter
                key={i}
                code={segment.content}
                language={segment.language}
              />
            );
          case "display-math":
            return (
              <MathRenderer
                key={i}
                text={`$$${segment.content}$$`}
              />
            );
          case "text":
          default:
            return hasMathContent(segment.content) ? (
              <MathRenderer
                key={i}
                text={segment.content}
                className="whitespace-pre-wrap"
              />
            ) : (
              <span key={i} className="whitespace-pre-wrap">
                {segment.content}
              </span>
            );
        }
      })}
    </div>
  );
}

export { hasMathContent, hasCodeContent };
