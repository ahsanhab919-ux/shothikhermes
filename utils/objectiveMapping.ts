import type { CampaignObjective, OptimizationGoal } from "@/types/metaCampaign";

/**
 * Maps Meta campaign objectives to appropriate optimization goals for ad sets
 * Based on Meta's ODAX framework and best practices
 */
export const getOptimizationGoalForObjective = (
  objective: CampaignObjective
): OptimizationGoal => {
  const mapping: Record<CampaignObjective, OptimizationGoal> = {
    // Brand awareness, reach, impressions
    OUTCOME_AWARENESS: "REACH",

    // Website visits, landing page views
    OUTCOME_TRAFFIC: "LINK_CLICKS",

    // Likes, comments, shares, video views
    OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",

    // Lead generation forms
    OUTCOME_LEADS: "LEAD_GENERATION",

    // App installs, app events
    OUTCOME_APP_PROMOTION: "APP_INSTALLS",

    // Conversions, purchases, catalog sales
    OUTCOME_SALES: "LINK_CLICKS", // Default to LINK_CLICKS, can be overridden to VALUE for e-commerce
  };

  return mapping[objective];
};

/**
 * Gets all valid optimization goals for a given campaign objective
 * Useful for frontend dropdowns and validation
 */
export const getValidOptimizationGoalsForObjective = (
  objective: CampaignObjective
): OptimizationGoal[] => {
  const validGoals: Record<CampaignObjective, OptimizationGoal[]> = {
    OUTCOME_AWARENESS: ["REACH", "IMPRESSIONS", "AD_RECALL_LIFT"],

    OUTCOME_TRAFFIC: ["LINK_CLICKS", "LANDING_PAGE_VIEWS"],

    OUTCOME_ENGAGEMENT: [
      "POST_ENGAGEMENT",
      "ENGAGED_USERS",
      "PAGE_LIKES",
      "THRUPLAY", // For video content
    ],

    OUTCOME_LEADS: ["LEAD_GENERATION", "QUALITY_LEAD"],

    OUTCOME_APP_PROMOTION: ["APP_INSTALLS", "IN_APP_VALUE"],

    OUTCOME_SALES: [
      "LINK_CLICKS",
      "LANDING_PAGE_VIEWS",
      "OFFSITE_CONVERSIONS",
      "VALUE", // Best for e-commerce with purchase tracking
    ],
  };

  return validGoals[objective];
};

/**
 * Gets the recommended optimization goal for a campaign objective
 * This is the most commonly used and effective option
 */
export const getRecommendedOptimizationGoalForObjective = (
  objective: CampaignObjective
): OptimizationGoal => {
  const recommended: Record<CampaignObjective, OptimizationGoal> = {
    OUTCOME_AWARENESS: "REACH",
    OUTCOME_TRAFFIC: "LINK_CLICKS",
    OUTCOME_ENGAGEMENT: "POST_ENGAGEMENT",
    OUTCOME_LEADS: "LEAD_GENERATION",
    OUTCOME_APP_PROMOTION: "APP_INSTALLS",
    OUTCOME_SALES: "LINK_CLICKS", // Can be changed to VALUE for e-commerce
  };

  return recommended[objective];
};

/**
 * Validates if an optimization goal is compatible with a campaign objective
 */
export const isOptimizationGoalValidForObjective = (
  objective: CampaignObjective,
  optimizationGoal: OptimizationGoal
): boolean => {
  const validGoals = getValidOptimizationGoalsForObjective(objective);
  return validGoals.includes(optimizationGoal);
};

/**
 * Gets a human-readable description of the optimization goal mapping
 */
export const getOptimizationGoalDescription = (
  objective: CampaignObjective
): string => {
  const descriptions: Record<CampaignObjective, string> = {
    OUTCOME_AWARENESS:
      "Optimizes for maximum reach to show your ad to as many people as possible",
    OUTCOME_TRAFFIC:
      "Optimizes for link clicks to drive traffic to your website",
    OUTCOME_ENGAGEMENT:
      "Optimizes for post engagement like likes, comments, and shares",
    OUTCOME_LEADS:
      "Optimizes for lead generation to collect contact information",
    OUTCOME_APP_PROMOTION:
      "Optimizes for app installs to promote your mobile app",
    OUTCOME_SALES: "Optimizes for conversions and sales on your website",
  };

  return descriptions[objective];
};
