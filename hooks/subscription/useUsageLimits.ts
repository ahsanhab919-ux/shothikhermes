"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSelector } from "react-redux";
import { useMemo, useCallback, useState } from "react";
import type { RootState } from "@/redux/store";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
  type UsageLimitKey,
  TOOL_TO_LIMIT_KEY,
} from "@/lib/subscription-tiers";

export interface UsageInfo {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  isUnlimited: boolean;
  isAtLimit: boolean;
}

export interface UsageLimitsState {
  usage: Record<UsageLimitKey, UsageInfo>;
  tier: SubscriptionTier;
  isLoading: boolean;
  periodEnd: number | null;
  checkTool: (tool: string) => UsageInfo;
  incrementTool: (tool: string) => Promise<{ success: boolean; used: number; limit: number }>;
}

export function useUsageLimits(): UsageLimitsState {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?._id || user?.email || "";

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    userId ? { userId } : "skip",
  );
  const usageData = useQuery(
    api.subscriptions.getUsage,
    userId ? { userId } : "skip",
  );
  const incrementUsageMutation = useMutation(api.subscriptions.incrementUsage);

  const tier = ((subscription?.tier as SubscriptionTier) || "free") as SubscriptionTier;
  const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;

  const usage = useMemo(() => {
    const result: Record<string, UsageInfo> = {};
    const limitKeys: UsageLimitKey[] = [
      "plagiarismChecks",
      "aiDetectorScans",
      "paraphraseUses",
      "grammarChecks",
      "humanizeUses",
      "summarizeUses",
      "translatorUses",
    ];

    for (const key of limitKeys) {
      const limit = tierConfig.limits[key];
      const used = (usageData as Record<string, number> | undefined)?.[key] || 0;
      const isUnlimited = limit === -1;
      const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
      const percentage = isUnlimited ? 0 : limit > 0 ? Math.min(100, (used / limit) * 100) : 100;

      result[key] = {
        used,
        limit,
        remaining,
        percentage,
        isUnlimited,
        isAtLimit: !isUnlimited && used >= limit,
      };
    }

    return result as Record<UsageLimitKey, UsageInfo>;
  }, [tierConfig, usageData]);

  const checkTool = useCallback(
    (tool: string): UsageInfo => {
      const key = TOOL_TO_LIMIT_KEY[tool];
      if (!key || !usage[key]) {
        return {
          used: 0,
          limit: -1,
          remaining: Infinity,
          percentage: 0,
          isUnlimited: true,
          isAtLimit: false,
        };
      }
      return usage[key];
    },
    [usage],
  );

  const incrementTool = useCallback(
    async (tool: string) => {
      if (!userId) {
        return { success: false, used: 0, limit: 0 };
      }
      return await incrementUsageMutation({ userId, tool });
    },
    [userId, incrementUsageMutation],
  );

  return {
    usage,
    tier,
    isLoading: subscription === undefined || usageData === undefined,
    periodEnd: usageData?.periodEnd || null,
    checkTool,
    incrementTool,
  };
}
