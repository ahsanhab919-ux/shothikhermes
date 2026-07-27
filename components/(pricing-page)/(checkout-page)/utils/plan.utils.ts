/**
 * Utility functions for plan operations
 */

/**
 * Get plan ID from plan object (handles both object and string formats)
 */
export const getPlanId = (plan: any): string | null => {
  if (!plan) return null;
  if (typeof plan === "object" && plan._id) {
    return typeof plan._id === "string" ? plan._id : plan._id.toString();
  }
  if (typeof plan === "string") {
    return plan;
  }
  return null;
};

/**
 * Get plan name from plan object
 */
export const getPlanName = (plan: any): string => {
  if (typeof plan === "object" && plan?.name) {
    return plan.name;
  }
  return "N/A";
};

/**
 * Get plan duration from plan object
 */
export const getPlanDuration = (plan: any): number => {
  if (typeof plan === "object" && plan?.duration) {
    return plan.duration;
  }
  return 0;
};

