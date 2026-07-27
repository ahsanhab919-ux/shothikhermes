"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => (
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">{children}</pre>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const text = String(children).replace(/\n$/, "");
            const isInline = !String(codeClassName || "").includes("language-");
            if (isInline) {
              return (
                <code className="bg-muted rounded px-1 py-0.5 text-xs" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <div className="space-y-2">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(text)}
                  >
                    Copy
                  </Button>
                </div>
                <code className={cn("block text-xs", codeClassName)} {...props}>
                  {children}
                </code>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
