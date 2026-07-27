"use client";

import { useSelector } from "react-redux";
import { useGetUsesLimitQuery } from "@/redux/api/tools/toolsApi";
import { useGetUserLimitQuery } from "@/redux/api/auth/authApi";
import { useCallback, useMemo } from "react";

interface RootState {
  auth: {
    user: User | null;
  };
}

interface User {
  email?: string;
  package?: string;
  [key: string]: unknown;
}

interface LimitData {
  remainingWord: number;
  totalWordLimit: number;
  [key: string]: unknown;
}

interface FeatureAccessResult {
  allowed: boolean;
  reason: string | null;
  remaining?: number;
  total?: number;
}

interface LimitInfo extends FeatureAccessResult {
  isPro: boolean;
  isAuthenticated: boolean;
  userPackage: string;
}

type FeatureType =
  | "paraphrase"
  | "grammar"
  | "summarize"
  | "humanize"
  | "ai_detector"
  | "ai_scan"
  | "plagiarism"
  | "export_docx"
  | "export_html"
  | "export_txt"
  | "citations";

type EnforcementLevel = "backend" | "subscription" | "none" | "auth_only";

type ReasonType = "login_required" | "word_limit_reached" | "pro_required" | null;

const WRITING_STUDIO_SERVICES: Record<string, string> = {
  paraphrase: "paraphrase",
  humanize: "bypass",
  grammar: "grammar",
  ai_detector: "ai_detector",
  plagiarism: "plagiarism",
};

const FEATURE_ENFORCEMENT: Record<string, EnforcementLevel> = {
  paraphrase: "backend",
  grammar: "backend",
  summarize: "backend",
  humanize: "backend",
  ai_detector: "subscription",
  plagiarism: "subscription",
  export_docx: "subscription",
  export_html: "subscription",
  export_txt: "none",
  citations: "auth_only",
};

export function useWritingStudioLimits() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const isPro = useMemo(() => {
    return !!(user?.package && user.package !== "free");
  }, [user?.package]);

  const isAuthenticated = useMemo(() => {
    return !!user?.email;
  }, [user?.email]);

  const { data: paraphraseLimits, refetch: refetchParaphrase } = useGetUsesLimitQuery(
    { service: WRITING_STUDIO_SERVICES.paraphrase },
    { skip: !isAuthenticated }
  ) as { data: LimitData | undefined; refetch: () => void };

  const { data: humanizeLimits, refetch: refetchHumanize } = useGetUsesLimitQuery(
    { service: WRITING_STUDIO_SERVICES.humanize },
    { skip: !isAuthenticated }
  ) as { data: LimitData | undefined; refetch: () => void };

  const { refetch: refetchUserLimit } = useGetUserLimitQuery(undefined, {
    skip: !isAuthenticated,
  });

  const refetchAll = useCallback(() => {
    if (isAuthenticated) {
      refetchParaphrase();
      refetchHumanize();
      refetchUserLimit();
    }
  }, [isAuthenticated, refetchParaphrase, refetchHumanize, refetchUserLimit]);

  const checkFeatureAccess = useCallback((feature: FeatureType): FeatureAccessResult => {
    if (!isAuthenticated) {
      return { allowed: false, reason: "login_required" };
    }

    switch (feature) {
      case "paraphrase":
      case "grammar":
      case "summarize":
        if (paraphraseLimits) {
          const hasWords = paraphraseLimits.remainingWord > 0 || paraphraseLimits.totalWordLimit === 99999;
          return {
            allowed: hasWords,
            reason: hasWords ? null : "word_limit_reached",
            remaining: paraphraseLimits.remainingWord,
            total: paraphraseLimits.totalWordLimit,
          };
        }
        return { allowed: true, reason: null };

      case "humanize":
        if (humanizeLimits) {
          const hasWords = humanizeLimits.remainingWord > 0 || humanizeLimits.totalWordLimit === 99999;
          return {
            allowed: hasWords,
            reason: hasWords ? null : "word_limit_reached",
            remaining: humanizeLimits.remainingWord,
            total: humanizeLimits.totalWordLimit,
          };
        }
        return { allowed: true, reason: null };

      case "ai_detector":
      case "ai_scan":
        return {
          allowed: isPro,
          reason: isPro ? null : "pro_required",
        };

      case "plagiarism":
        return {
          allowed: isPro,
          reason: isPro ? null : "pro_required",
        };

      case "export_docx":
      case "export_html":
        return {
          allowed: isPro,
          reason: isPro ? null : "pro_required",
        };

      case "export_txt":
        return { allowed: true, reason: null };

      case "citations":
        return { allowed: isAuthenticated, reason: isAuthenticated ? null : "login_required" };

      default:
        return { allowed: true, reason: null };
    }
  }, [isAuthenticated, isPro, paraphraseLimits, humanizeLimits]);

  const getLimitInfo = useCallback((feature: FeatureType): LimitInfo => {
    const access = checkFeatureAccess(feature);
    return {
      ...access,
      isPro,
      isAuthenticated,
      userPackage: user?.package || "free",
    };
  }, [checkFeatureAccess, isPro, isAuthenticated, user?.package]);

  return {
    isPro,
    isAuthenticated,
    userPackage: user?.package || "free",
    paraphraseLimits,
    humanizeLimits,
    checkFeatureAccess,
    getLimitInfo,
    refetchAll,
  };
}

export function getUpgradeMessage(reason: ReasonType): string {
  switch (reason) {
    case "login_required":
      return "Please sign in to use this feature";
    case "word_limit_reached":
      return "You've reached your word limit for today";
    case "pro_required":
      return "This feature requires an upgrade to Academic Pro";
    default:
      return "Please upgrade to continue";
  }
}

export function getFeatureEnforcement(feature: string): EnforcementLevel {
  return FEATURE_ENFORCEMENT[feature] || "none";
}
