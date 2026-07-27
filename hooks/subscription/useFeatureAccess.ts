import { useSubscription } from "./useSubscription";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscription-tiers";

export interface FeatureAccess {
  writingStudioPro: boolean;
  publishingDistribution: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  maxProjects: number;
  tier: SubscriptionTier;
  isLoading: boolean;
}

export function useFeatureAccess(): FeatureAccess {
  const subscription = useSubscription();
  const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];

  return {
    writingStudioPro: tierConfig.limits.writingStudioPro,
    publishingDistribution: tierConfig.limits.publishingDistribution,
    apiAccess: tierConfig.limits.apiAccess,
    prioritySupport: tierConfig.limits.prioritySupport,
    maxProjects: tierConfig.limits.maxProjects,
    tier: subscription.tier,
    isLoading: subscription.isLoading,
  };
}
