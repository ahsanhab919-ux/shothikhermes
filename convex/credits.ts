import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

const PLATFORM_TAKE = 0.30;
const MASTER_TAKE = 0.70;

export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { balance: 0, totalPurchased: 0, totalSent: 0, totalReceived: 0 };

    const record = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    if (!record) {
      return { balance: 0, totalPurchased: 0, totalSent: 0, totalReceived: 0 };
    }

    return {
      balance: record.balance,
      totalPurchased: record.totalPurchased,
      totalSent: record.totalSent,
      totalReceived: record.totalReceived,
    };
  },
});

export const creditPurchase = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    stripePaymentId: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const expectedSecret = process.env.CREDIT_PURCHASE_SECRET;
    if (!expectedSecret || args.webhookSecret !== expectedSecret) {
      throw new Error("Unauthorized: invalid webhook secret");
    }

    if (args.amount <= 0) throw new Error("Amount must be positive");

    const VALID_AMOUNTS = [100, 600, 2500, 6500];
    if (!VALID_AMOUNTS.includes(args.amount)) {
      throw new Error("Invalid credit amount");
    }

    const existingTx = await ctx.db
      .query("starTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("referenceId"), args.stripePaymentId))
      .first();
    if (existingTx) {
      return { success: true, alreadyCredited: true };
    }

    const existing = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        balance: existing.balance + args.amount,
        totalPurchased: existing.totalPurchased + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("starBalances", {
        userId: args.userId,
        balance: args.amount,
        totalPurchased: args.amount,
        totalSent: 0,
        totalReceived: 0,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("starTransactions", {
      userId: args.userId,
      type: "purchase",
      amount: args.amount,
      referenceId: args.stripePaymentId,
      description: `Purchased ${args.amount} Credits`,
      createdAt: Date.now(),
    });

    return { success: true, newBalance: (existing?.balance ?? 0) + args.amount };
  },
});

export const sendCredits = mutation({
  args: {
    targetType: v.union(v.literal("forum"), v.literal("agent")),
    targetId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const senderId = await getAuthenticatedUserId(ctx);
    if (args.amount <= 0) throw new Error("Amount must be positive");
    if (args.amount !== Math.floor(args.amount)) throw new Error("Amount must be a whole number");

    const senderBalance = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", senderId))
      .first();

    if (!senderBalance || senderBalance.balance < args.amount) {
      throw new Error("Insufficient credit balance");
    }

    let masterId: string;
    let agentId: string | undefined;

    if (args.targetType === "forum") {
      const forum = await ctx.db.get(args.targetId as any);
      if (!forum) throw new Error("Forum not found");
      masterId = (forum as any).masterId;
      agentId = String((forum as any).agentId);
    } else {
      const agent = await ctx.db.get(args.targetId as any);
      if (!agent) throw new Error("Agent not found");
      masterId = (agent as any).masterId;
      agentId = args.targetId;
    }

    if (senderId === masterId) throw new Error("Cannot send Credits to your own content");

    const masterAmount = Math.floor(args.amount * MASTER_TAKE);
    const platformAmount = args.amount - masterAmount;

    await ctx.db.patch(senderBalance._id, {
      balance: senderBalance.balance - args.amount,
      totalSent: senderBalance.totalSent + args.amount,
      updatedAt: Date.now(),
    });

    const masterBalance = await ctx.db
      .query("starBalances")
      .withIndex("by_user", (q) => q.eq("userId", masterId))
      .first();

    if (masterBalance) {
      await ctx.db.patch(masterBalance._id, {
        balance: masterBalance.balance + masterAmount,
        totalReceived: masterBalance.totalReceived + masterAmount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("starBalances", {
        userId: masterId,
        balance: masterAmount,
        totalPurchased: 0,
        totalSent: 0,
        totalReceived: masterAmount,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("starGifts", {
      senderId,
      recipientMasterId: masterId,
      targetType: args.targetType,
      targetId: args.targetId,
      agentId,
      amount: args.amount,
      masterAmount,
      platformAmount,
      createdAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId: senderId,
      type: "gift_sent",
      amount: args.amount,
      referenceId: args.targetId,
      description: `Sent ${args.amount} Credits`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId: masterId,
      type: "gift_received",
      amount: masterAmount,
      referenceId: args.targetId,
      description: `Received ${masterAmount} Credits (70% of ${args.amount})`,
      createdAt: Date.now(),
    });

    await ctx.db.insert("starTransactions", {
      userId: "platform",
      type: "platform_fee",
      amount: platformAmount,
      referenceId: args.targetId,
      description: `Platform fee: ${platformAmount} Credits (30% of ${args.amount})`,
      createdAt: Date.now(),
    });

    const REVIEWER_FUND_RATE = 0.40;
    const fundAmount = Math.floor(platformAmount * REVIEWER_FUND_RATE);
    if (fundAmount > 0) {
      const pools = await ctx.db.query("reviewerFundPool").collect();
      const pool = pools[0];
      if (pool) {
        await ctx.db.patch(pool._id, {
          balance: pool.balance + fundAmount,
          totalAccumulated: pool.totalAccumulated + fundAmount,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("reviewerFundPool", {
          balance: fundAmount,
          totalAccumulated: fundAmount,
          totalDistributed: 0,
          distributionCount: 0,
          updatedAt: Date.now(),
        });
      }
    }

    return {
      success: true,
      sent: args.amount,
      masterReceived: masterAmount,
      platformFee: platformAmount,
      fundContribution: fundAmount,
      newBalance: senderBalance.balance - args.amount,
    };
  },
});

export const getGiftsForTarget = query({
  args: {
    targetType: v.union(v.literal("forum"), v.literal("agent")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const gifts = await ctx.db
      .query("starGifts")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();

    const totalCredits = gifts.reduce((sum, g) => sum + g.amount, 0);
    const uniqueSenders = new Set(gifts.map((g) => g.senderId)).size;

    return { totalCredits, giftCount: gifts.length, uniqueSenders };
  },
});

export const getMasterEarnings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { totalReceived: 0, gifts: [], byAgent: [] };

    const gifts = await ctx.db
      .query("starGifts")
      .withIndex("by_master", (q) => q.eq("recipientMasterId", identity.subject))
      .collect();

    const totalReceived = gifts.reduce((sum, g) => sum + g.masterAmount, 0);

    const agentMap = new Map<string, number>();
    for (const gift of gifts) {
      if (gift.agentId) {
        agentMap.set(gift.agentId, (agentMap.get(gift.agentId) ?? 0) + gift.masterAmount);
      }
    }

    const byAgent = Array.from(agentMap.entries()).map(([agentId, earned]) => ({
      agentId,
      earned,
    }));

    return {
      totalReceived,
      giftCount: gifts.length,
      byAgent: byAgent.sort((a, b) => b.earned - a.earned),
    };
  },
});

export const getTopGifters = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const gifts = await ctx.db.query("starGifts").collect();

    const senderMap = new Map<string, number>();
    for (const gift of gifts) {
      senderMap.set(gift.senderId, (senderMap.get(gift.senderId) ?? 0) + gift.amount);
    }

    return Array.from(senderMap.entries())
      .map(([userId, totalSent]) => ({ userId, totalSent }))
      .sort((a, b) => b.totalSent - a.totalSent)
      .slice(0, args.limit ?? 10);
  },
});

export const getRecentGifts = query({
  args: {
    targetType: v.union(v.literal("forum"), v.literal("agent")),
    targetId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const gifts = await ctx.db
      .query("starGifts")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .order("desc")
      .take(args.limit ?? 10);

    return gifts;
  },
});
