"use client";

export interface CompactMarkdownProps {
  content: unknown;
  className?: string;
}

const formatJsonLikeString = (str: string): string => {
  try {
    const parsed = JSON.parse(str);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
};

const normalizeValue = (
  content: unknown,
): { data: unknown; isStructured: boolean } => {
  if (typeof content === "object" && content !== null) {
    return { data: content, isStructured: true };
  }
  if (typeof content === "string") {
    const trimmed = content.trim();
    const looksLikeJson =
      (trimmed.startsWith("{") &&
        (trimmed.endsWith("}") || trimmed.includes("}"))) ||
      (trimmed.startsWith("[") &&
        (trimmed.endsWith("]") || trimmed.includes("]")));
    if (looksLikeJson) {
      return { data: content, isStructured: true };
    }
    return { data: content, isStructured: false };
  }
  return { data: String(content), isStructured: false };
};

export function CompactMarkdown({
  content,
  className = "",
}: CompactMarkdownProps) {
  const { data, isStructured } = normalizeValue(content);

  const baseClasses =
    "bg-muted rounded-xl p-3 max-h-60 overflow-y-auto text-xs text-muted-foreground w-fit max-w-[32rem]";

  if (isStructured) {
    const displayText =
      typeof data === "string"
        ? formatJsonLikeString(data)
        : JSON.stringify(data, null, 2);

    return (
      <pre
        className={`${baseClasses} whitespace-pre-wrap break-words ${className}`}
      >
        {displayText}
      </pre>
    );
  }

  const textContent = String(data);

  return (
    <div className={`${baseClasses} leading-relaxed ${className}`}>
      {textContent}
    </div>
  );
}

export default CompactMarkdown;
