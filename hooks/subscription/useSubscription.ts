"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSelector } from "react-redux";
import { useMemo } from "react";
import type { RootState } from "@/redux/store";
import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTier,
} from "@/lib/subscription-tiers";

export interface SubscriptionState {
  tier: SubscriptionTier;
  tierName: string;
  status: string;
  interval: "month" | "year";
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  isLoading: boolean;
  isPaid: boolean;
  isActive: boolean;
  tierConfig: (typeof SUBSCRIPTION_TIERS)[SubscriptionTier];
}

export function useSubscription(): SubscriptionState {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?._id || user?.email || "";

  const subscription = useQuery(
    api.subscriptions.getUserSubscription,
    userId ? { userId } : "skip",
  );

  return useMemo(() => {
    const tier = ((subscription?.tier as SubscriptionTier) || "free") as SubscriptionTier;
    const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
    const interval = subscription?.interval === "year" ? "year" : "month";

    return {
      tier,
      tierName: tierConfig.name,
      status: subscription?.status || "active",
      interval,
      currentPeriodEnd: subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
      stripeSubscriptionId: subscription?.stripeSubscriptionId,
      stripeCustomerId: subscription?.stripeCustomerId,
      isLoading: subscription === undefined,
      isPaid: tier !== "free",
      isActive: subscription?.status === "active" || tier === "free",
      tierConfig,
    };
  }, [subscription]);
}
