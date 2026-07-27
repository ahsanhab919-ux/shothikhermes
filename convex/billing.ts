import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin } from "./lib/auth";

async function resolveUserId(ctx: any, userId: string | undefined): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) return identity.subject;
  if (userId) return userId;
  throw new Error("Authentication required");
}

async function resolveUserDocId(ctx: any, input: string | { __tableName: "users" } | undefined) {
  if (!input) return null;
  if (typeof input !== "string") return input as any;
  const row = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("userId", input))
    .first();
  return row?._id ?? null;
}

export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q: any) =>
        q.eq("stripeCustomerId", args.stripeCustomerId),
      )
      .first();

    return user ? { userId: user._id, email: user.email } : null;
  },
});

export const getSubscriptionPlanByPriceId = query({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    const monthly = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_stripe_price_monthly", (q: any) =>
        q.eq("stripePriceIdMonthly", args.stripePriceId),
      )
      .first();
    if (monthly) return monthly;

    return await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_stripe_price_yearly", (q: any) =>
        q.eq("stripePriceIdYearly", args.stripePriceId),
      )
      .first();
  },
});

export const getUserCredits = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) {
      return {
        userId: args.userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        tier: "free",
        monthlyLimit: 1000,
        monthlyUsed: 0,
        monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
    }

    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .first();

    if (!credits) {
      return {
        userId: userDocId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        tier: "free",
        monthlyLimit: 1000,
        monthlyUsed: 0,
        monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
    }

    return credits;
  },
});

export const initializeUserCredits = mutation({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) throw new Error("User not found");

    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("userCredits", {
      userId: userDocId,
      balance: 100,
      lifetimeEarned: 100,
      lifetimeSpent: 0,
      tier: "free",
      monthlyLimit: 1000,
      monthlyUsed: 0,
      monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    });
  },
});

export const spendCredits = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    amount: v.number(),
    description: v.string(),
    metadata: v.optional(
      v.object({
        tool: v.optional(v.string()),
        tokens: v.optional(v.number()),
        model: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) throw new Error("User not found");
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .first();
    if (!credits) throw new Error("User credits not found");
    if (credits.balance < args.amount) throw new Error("Insufficient credits");

    const newBalance = credits.balance - args.amount;
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeSpent: credits.lifetimeSpent + args.amount,
      monthlyUsed: credits.monthlyUsed + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditTransactions", {
      userId: userDocId,
      type: "usage",
      amount: -args.amount,
      balanceAfter: newBalance,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const addCredits = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    amount: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("refund"),
      v.literal("bonus"),
      v.literal("adjustment"),
    ),
    description: v.string(),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) throw new Error("User not found");
    if (args.amount <= 0) throw new Error("Amount must be positive");

    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .first();
    if (!credits) throw new Error("User credits not found");

    const newBalance = credits.balance + args.amount;
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeEarned: credits.lifetimeEarned + args.amount,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditTransactions", {
      userId: userDocId,
      type: args.type,
      amount: args.amount,
      balanceAfter: newBalance,
      description: args.description,
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const getSubscriptionPlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .order("asc")
      .take(20);
  },
});

export const getUserSubscription = query({
  args: { userId: v.union(v.id("users"), v.string()) },
  handler: async (ctx, args) => {
    const userId =
      typeof args.userId === "string"
        ? args.userId
        : (await ctx.db.get(args.userId as any) as any)?.userId;
    if (!userId) return null;
    return await ctx.runQuery(api.subscriptions.getUserSubscription, { userId });
  },
});

export const createSubscription = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    interval: v.union(v.literal("month"), v.literal("year")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await resolveUserId(ctx, typeof args.userId === "string" ? args.userId : undefined);
    const tier = args.tier ?? "free";

    await ctx.runMutation(api.subscriptions.upsertSubscription, {
      userId,
      tier,
      status: "active",
      interval: args.interval,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      cancelAtPeriodEnd: false,
      webhookSecret: process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || "",
    } as any);

    const userRow = await getOrCreateUserRow(ctx, userId);
    if (userRow) {
      await ctx.db.patch(userRow._id, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

async function getOrCreateUserRow(ctx: any, userId: string) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .first();
  if (existing) return existing;
  const now = Date.now();
  const id = await ctx.db.insert("users", {
    userId,
    email: undefined,
    stripeCustomerId: undefined,
    preferences: {},
    createdAt: now,
    updatedAt: now,
  });
  return await ctx.db.get(id);
}

export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.subscriptions.cancelSubscription, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      webhookSecret: process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET || "",
    } as any);
    return { success: true };
  },
});

export const getTransactionHistory = query({
  args: {
    userId: v.union(v.id("users"), v.string()),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) return [];
    let q = ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .order("desc");
    if (args.type) {
      q = q.filter((q: any) => q.eq(q.field("type"), args.type));
    }
    return await q.take(args.limit ?? 50);
  },
});

export const recordUsageMetric = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    date: v.string(),
    hour: v.optional(v.number()),
    metrics: v.any(),
  },
  handler: async (ctx, args) => {
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) throw new Error("User not found");
    const hour = args.hour ?? 0;

    const existing = await ctx.db
      .query("usageMetrics")
      .withIndex("by_user_and_hour", (q: any) => q.eq("userId", userDocId).eq("hour", hour))
      .filter((q: any) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) {
      const merged = { ...(existing.metrics ?? {}) };
      for (const [k, v] of Object.entries(args.metrics ?? {})) {
        if (v === undefined) continue;
        merged[k] = (merged[k] ?? 0) + (v as any);
      }
      await ctx.db.patch(existing._id, { metrics: merged });
      return existing._id;
    }

    return await ctx.db.insert("usageMetrics", {
      userId: userDocId,
      date: args.date,
      hour,
      metrics: args.metrics ?? {},
      createdAt: Date.now(),
    });
  },
});

export const storeWebhookEvent = mutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookEvents", {
      id: `wh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      stripeEventId: args.stripeEventId,
      type: args.type,
      payload: args.payload,
      processed: false,
      createdAt: Date.now(),
    });
  },
});

export const markWebhookProcessed = mutation({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_stripe_event", (q: any) => q.eq("stripeEventId", args.stripeEventId))
      .first();
    if (event) {
      await ctx.db.patch(event._id, { processed: true, processedAt: Date.now() });
    }
    return { success: true };
  },
});

export const adminAdjustCredits = mutation({
  args: {
    userId: v.union(v.id("users"), v.string()),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userDocId = await resolveUserDocId(ctx, args.userId as any);
    if (!userDocId) throw new Error("User not found");

    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q: any) => q.eq("userId", userDocId))
      .first();
    if (!credits) throw new Error("User credits not found");

    const newBalance = credits.balance + args.amount;
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeEarned: args.amount > 0 ? credits.lifetimeEarned + args.amount : credits.lifetimeEarned,
      lifetimeSpent: args.amount < 0 ? credits.lifetimeSpent + Math.abs(args.amount) : credits.lifetimeSpent,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("creditTransactions", {
      userId: userDocId,
      type: "adjustment",
      amount: args.amount,
      balanceAfter: newBalance,
      description: args.reason,
      createdAt: Date.now(),
    });

    return { success: true, newBalance };
  },
});

export const adminSeedSubscriptionPlan = internalMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    features: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_active", (q: any) => q.eq("isActive", true))
      .filter((q: any) => q.eq(q.field("name"), args.name))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        description: args.description ?? existing.description,
        stripePriceIdMonthly: args.stripePriceIdMonthly ?? existing.stripePriceIdMonthly,
        stripePriceIdYearly: args.stripePriceIdYearly ?? existing.stripePriceIdYearly,
        isActive: args.isActive ?? existing.isActive,
        features: args.features ?? existing.features,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptionPlans", {
      name: args.name,
      description: args.description,
      stripePriceIdMonthly: args.stripePriceIdMonthly,
      stripePriceIdYearly: args.stripePriceIdYearly,
      isActive: args.isActive ?? true,
      features: args.features,
      createdAt: now,
      updatedAt: now,
    });
  },
});
