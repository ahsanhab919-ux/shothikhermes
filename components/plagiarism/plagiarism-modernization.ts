import type { PlagiarismReport } from "@/types/plagiarism";

export type PlagiarismErrorTier = "input" | "api" | "system";

export interface PlagiarismInlineError {
  tier: PlagiarismErrorTier;
  shortMessage: string;
  detailMessage: string;
  recoveryAction: string;
}

export function getOriginalityScore(report: PlagiarismReport | null) {
  if (!report) return 100;
  const score = Number.isFinite(report.score) ? report.score : 0;
  return Math.max(0, Math.min(100, 100 - score));
}

export function getOriginalityTone(originality: number) {
  if (originality > 90) {
    return {
      label: "High originality",
      classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }
  if (originality >= 70) {
    return {
      label: "Needs review",
      classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }
  return {
    label: "High similarity risk",
    classes: "border-destructive/30 bg-destructive/10 text-destructive",
  };
}

export function normalizePlagiarismInlineError(
  error: unknown,
  inputText: string,
): PlagiarismInlineError {
  const text = inputText?.trim() || "";

  if (!text) {
    return {
      tier: "input",
      shortMessage: "Add text to scan",
      detailMessage: "Paste or upload text before running a plagiarism scan.",
      recoveryAction: "Add text and scan again.",
    };
  }

  if (text.length > 60000) {
    return {
      tier: "input",
      shortMessage: "Text is too long",
      detailMessage: "Split large documents into smaller sections before scanning.",
      recoveryAction: "Shorten the text and retry.",
    };
  }

  const rawMessage =
    typeof error === "object" && error !== null
      ? // @ts-expect-error legacy runtime shape
        error?.message || error?.data?.message || "Unable to complete the plagiarism scan."
      : "Unable to complete the plagiarism scan.";

  const message = String(rawMessage || "Unable to complete the plagiarism scan.");

  if (/timeout|too long|cancelled/i.test(message)) {
    return {
      tier: "api",
      shortMessage: "Scan timed out",
      detailMessage: "The plagiarism service took too long to respond.",
      recoveryAction: "Retry or shorten the text.",
    };
  }

  if (/connect|network|internet/i.test(message)) {
    return {
      tier: "system",
      shortMessage: "Network issue",
      detailMessage: "We could not reach the plagiarism service from this browser session.",
      recoveryAction: "Check your connection and retry.",
    };
  }

  if (/unavailable|server|503|500/i.test(message)) {
    return {
      tier: "api",
      shortMessage: "Service unavailable",
      detailMessage: "The plagiarism service is temporarily unavailable.",
      recoveryAction: "Retry in a moment.",
    };
  }

  return {
    tier: "api",
    shortMessage: message.slice(0, 140),
    detailMessage: message,
    recoveryAction: "Retry the scan.",
  };
}
