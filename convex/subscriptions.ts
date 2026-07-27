import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const TIER_LIMITS: Record<string, Record<string, number>> = {
  free: {
    plagiarismChecks: 3,
    aiDetectorScans: 3,
    paraphraseUses: 5,
    grammarChecks: 10,
    humanizeUses: 3,
    summarizeUses: 5,
    translatorUses: 10,
  },
  student: {
    plagiarismChecks: 30,
    aiDetectorScans: 30,
    paraphraseUses: 50,
    grammarChecks: 100,
    humanizeUses: 20,
    summarizeUses: 50,
    translatorUses: 100,
  },
  researcher: {
    plagiarismChecks: 100,
    aiDetectorScans: 100,
    paraphraseUses: 200,
    grammarChecks: -1,
    humanizeUses: 100,
    summarizeUses: 200,
    translatorUses: -1,
  },
  pro: {
    plagiarismChecks: -1,
    aiDetectorScans: -1,
    paraphraseUses: -1,
    grammarChecks: -1,
    humanizeUses: -1,
    summarizeUses: -1,
    translatorUses: -1,
  },
};

const USAGE_FIELDS = [
  "plagiarismChecks",
  "aiDetectorScans",
  "paraphraseUses",
  "grammarChecks",
  "humanizeUses",
  "summarizeUses",
  "translatorUses",
] as const;

function getMonthEnd(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
}

function mapToolToKey(tool: string): string {
  const mapping: Record<string, string> = {
    plagiarism: "plagiarismChecks",
    "plagiarism-checker": "plagiarismChecks",
    "ai-detector": "aiDetectorScans",
    ai_detector: "aiDetectorScans",
    paraphrase: "paraphraseUses",
    grammar: "grammarChecks",
    "grammar-checker": "grammarChecks",
    humanize: "humanizeUses",
    "humanize-gpt": "humanizeUses",
    summarize: "summarizeUses",
    translator: "translatorUses",
  };
  return mapping[tool] || tool;
}

function getUsageField(
  usage: Record<string, unknown>,
  key: string,
): number {
  const val = usage[key];
  return typeof val === "number" ? val : 0;
}

export const getUserSubscription = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!sub) {
      return {
        tier: "free" as const,
        status: "active" as const,
        interval: "month" as const,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: undefined,
        stripeCustomerId: undefined,
      };
    }

    return {
      _id: sub._id,
      tier: sub.tier,
      status: sub.status,
      interval: sub.interval,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      stripeCustomerId: sub.stripeCustomerId,
    };
  },
});

export const getUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const defaultUsage = {
      plagiarismChecks: 0,
      aiDetectorScans: 0,
      paraphraseUses: 0,
      grammarChecks: 0,
      humanizeUses: 0,
      summarizeUses: 0,
      translatorUses: 0,
      periodStart: Date.now(),
      periodEnd: getMonthEnd(),
    };

    if (!usage || usage.periodEnd < Date.now()) {
      return defaultUsage;
    }

    return {
      plagiarismChecks: usage.plagiarismChecks,
      aiDetectorScans: usage.aiDetectorScans,
      paraphraseUses: usage.paraphraseUses,
      grammarChecks: usage.grammarChecks,
      humanizeUses: usage.humanizeUses,
      summarizeUses: usage.summarizeUses,
      translatorUses: usage.translatorUses,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
    };
  },
});

export const checkUsageLimit = query({
  args: {
    userId: v.string(),
    tool: v.string(),
  },
  handler: async (ctx, { userId, tool }) => {
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = sub?.tier || "free";
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const toolKey = mapToolToKey(tool);
    const limit = limits[toolKey] ?? 0;

    if (limit === -1) {
      return { allowed: true, used: 0, limit: -1, tier };
    }

    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let used = 0;
    if (usage && usage.periodEnd >= Date.now()) {
      used = getUsageField(usage, toolKey);
    }

    return { allowed: used < limit, used, limit, tier };
  },
});

export const incrementUsage = mutation({
  args: {
    userId: v.string(),
    tool: v.string(),
  },
  handler: async (ctx, { userId, tool }) => {
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const tier = sub?.tier || "free";
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
    const toolKey = mapToolToKey(tool);
    const limit = limits[toolKey] ?? 0;

    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (!usage || usage.periodEnd < now) {
      const periodEnd = getMonthEnd();
      const freshUsage = {
        userId,
        plagiarismChecks: toolKey === "plagiarismChecks" ? 1 : 0,
        aiDetectorScans: toolKey === "aiDetectorScans" ? 1 : 0,
        paraphraseUses: toolKey === "paraphraseUses" ? 1 : 0,
        grammarChecks: toolKey === "grammarChecks" ? 1 : 0,
        humanizeUses: toolKey === "humanizeUses" ? 1 : 0,
        summarizeUses: toolKey === "summarizeUses" ? 1 : 0,
        translatorUses: toolKey === "translatorUses" ? 1 : 0,
        periodStart: now,
        periodEnd,
        updatedAt: now,
      };

      if (usage) {
        await ctx.db.replace(usage._id, freshUsage);
      } else {
        await ctx.db.insert("subscriptionUsage", freshUsage);
      }

      return { success: true, used: 1, limit };
    }

    const currentUsed = getUsageField(usage, toolKey);

    if (limit !== -1 && currentUsed >= limit) {
      return { success: false, used: currentUsed, limit };
    }

    const newUsed = currentUsed + 1;

    const patch: Record<string, number> = { updatedAt: now };
    patch[toolKey] = newUsed;
    await ctx.db.patch(usage._id, patch);

    return { success: true, used: newUsed, limit };
  },
});

export const upsertSubscription = mutation({
  args: {
    userId: v.string(),
    tier: v.string(),
    status: v.string(),
    interval: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
    if (!expectedSecret || args.webhookSecret !== expectedSecret) {
      throw new Error("Unauthorized: invalid webhook secret");
    }

    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tier: args.tier,
        status: args.status,
        interval: args.interval,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userSubscriptions", {
      userId: args.userId,
      tier: args.tier,
      status: args.status,
      interval: args.interval,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const cancelSubscription = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, { stripeSubscriptionId, webhookSecret }) => {
    const expectedSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      throw new Error("Unauthorized: invalid webhook secret");
    }

    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", stripeSubscriptionId),
      )
      .first();

    if (!sub) return false;

    await ctx.db.patch(sub._id, {
      status: "canceled",
      cancelAtPeriodEnd: true,
      canceledAt: Date.now(),
      updatedAt: Date.now(),
    });

    return true;
  },
});

export const updateUserTier = mutation({
  args: {
    userId: v.string(),
    tier: v.string(),
    expiresAt: v.optional(v.number()),
    webhookSecret: v.string(),
  },
  handler: async (ctx, { userId, tier, expiresAt, webhookSecret }) => {
    const expectedSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      throw new Error("Unauthorized: invalid webhook secret");
    }

    const existingSub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existingSub) {
      await ctx.db.patch(existingSub._id, {
        tier,
        ...(expiresAt ? { currentPeriodEnd: expiresAt } : {}),
        updatedAt: now,
      });
    } else {
      const periodEnd = expiresAt || now + 30 * 24 * 60 * 60 * 1000;
      await ctx.db.insert("userSubscriptions", {
        userId,
        tier,
        status: "active",
        interval: "month",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripeCustomerId: "",
        stripeSubscriptionId: "",
        stripePriceId: "",
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return true;
  },
});
