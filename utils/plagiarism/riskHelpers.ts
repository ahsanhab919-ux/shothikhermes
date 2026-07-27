import type { RiskLevel } from "@/types/plagiarism";

type TranslationFn = (key: string) => string;

export const getRiskLabel = (risk: RiskLevel, t?: TranslationFn): string => {
  if (t) {
    const map: Record<RiskLevel, string> = {
      LOW: t("tools.plagiarism.risk.low"),
      MEDIUM: t("tools.plagiarism.risk.moderate"),
      HIGH: t("tools.plagiarism.risk.high"),
    };
    return map[risk];
  }
  const RISK_LABELS: Record<RiskLevel, string> = {
    LOW: "Low Risk",
    MEDIUM: "Moderate Risk",
    HIGH: "High Risk",
  };
  return RISK_LABELS[risk];
};

export const getRiskDescription = (risk: RiskLevel, t?: TranslationFn): string => {
  if (t) {
    const map: Record<RiskLevel, string> = {
      LOW: t("tools.plagiarism.risk.lowDescription"),
      MEDIUM: t("tools.plagiarism.risk.moderateDescription"),
      HIGH: t("tools.plagiarism.risk.highDescription"),
    };
    return map[risk];
  }
  const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
    LOW: "Content appears mostly original with minor similarities detected.",
    MEDIUM: "Notable overlaps found. Review highlighted sections carefully.",
    HIGH: "Significant overlap detected. Immediate review is recommended.",
  };
  return RISK_DESCRIPTIONS[risk];
};

const RISK_BADGE_CLASSES: Record<RiskLevel, string> = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-rose-100 text-rose-700 border-rose-200",
};

export const getRiskBadgeClasses = (risk: RiskLevel): string =>
  RISK_BADGE_CLASSES[risk];

export const getSimilarityTone = (similarity: number): string => {
  if (similarity >= 80) return "text-rose-600 dark:text-rose-400";
  if (similarity >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
};

export const getSimilarityColor = (similarity: number): {
  bg: string;
  text: string;
  border: string;
} => {
  if (similarity >= 80) {
    return {
      bg: "bg-rose-100 dark:bg-rose-900/40",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-300 dark:border-rose-700",
    };
  }
  if (similarity >= 50) {
    return {
      bg: "bg-amber-100 dark:bg-amber-900/40",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-300 dark:border-amber-700",
    };
  }
  return {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-700",
  };
};

export const formatAnalyzedTimestamp = (timestamp?: string | null): string => {
  if (!timestamp) return "—";

  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "—";
  }
};
