import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

const MIN_ELIGIBILITY_LEVEL = 2;
const FUND_RATE = 0.40;

export const getPoolStatus = query({
  args: {},
  handler: async (ctx) => {
    const pools = await ctx.db.query("reviewerFundPool").collect();
    const pool = pools[0];

    if (!pool) {
      return {
        balance: 0,
        totalAccumulated: 0,
        totalDistributed: 0,
        distributionCount: 0,
        lastDistributionAt: null,
        fundRate: FUND_RATE,
      };
    }

    return {
      balance: pool.balance,
      totalAccumulated: pool.totalAccumulated,
      totalDistributed: pool.totalDistributed,
      distributionCount: pool.distributionCount,
      lastDistributionAt: pool.lastDistributionAt ?? null,
      fundRate: FUND_RATE,
    };
  },
});

export const getEligibleReviewers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allRep = await ctx.db.query("userReputation").collect();
    const eligible = allRep.filter((r) => r.level >= MIN_ELIGIBILITY_LEVEL);

    const scored = eligible.map((r) => ({
      userId: r.userId,
      karma: r.karma,
      reviewCount: r.reviewCount,
      helpfulnessScore: r.helpfulnessScore,
      level: r.level,
      weightedScore:
        r.helpfulnessScore * Math.sqrt(r.reviewCount) * (1 + r.karma / 1000),
    }));

    scored.sort((a, b) => b.weightedScore - a.weightedScore);
    const totalScore = scored.reduce((sum, s) => sum + s.weightedScore, 0);

    return scored.slice(0, args.limit ?? 50).map((s, i) => ({
      ...s,
      rank: i + 1,
      sharePercent: totalScore > 0 ? (s.weightedScore / totalScore) * 100 : 0,
    }));
  },
});

export const getMyFundEarnings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { totalEarned: 0, distributions: [], eligible: false };

    const rep = await ctx.db
      .query("userReputation")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first();

    const eligible = (rep?.level ?? 0) >= MIN_ELIGIBILITY_LEVEL;

    const distributions = await ctx.db
      .query("reviewerFundDistributions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const totalEarned = distributions.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalEarned,
      distributions: distributions.sort((a, b) => b.createdAt - a.createdAt),
      eligible,
      currentLevel: rep?.level ?? 0,
      requiredLevel: MIN_ELIGIBILITY_LEVEL,
    };
  },
});

export const getDistributionHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allDist = await ctx.db.query("reviewerFundDistributions").collect();

    const periodMap = new Map<
      string,
      { periodLabel: string; totalDistributed: number; recipientCount: number; createdAt: number }
    >();

    for (const d of allDist) {
      const existing = periodMap.get(d.periodLabel);
      if (existing) {
        existing.totalDistributed += d.amount;
        existing.recipientCount += 1;
      } else {
        periodMap.set(d.periodLabel, {
          periodLabel: d.periodLabel,
          totalDistributed: d.amount,
          recipientCount: 1,
          createdAt: d.createdAt,
        });
      }
    }

    return Array.from(periodMap.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 20);
  },
});

export const accumulateToPool = internalMutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    if (args.amount <= 0) return;

    const pools = await ctx.db.query("reviewerFundPool").collect();
    const pool = pools[0];

    if (pool) {
      await ctx.db.patch(pool._id, {
        balance: pool.balance + args.amount,
        totalAccumulated: pool.totalAccumulated + args.amount,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("reviewerFundPool", {
        balance: args.amount,
        totalAccumulated: args.amount,
        totalDistributed: 0,
        distributionCount: 0,
        updatedAt: Date.now(),
      });
    }
  },
});

export const distributePool = mutation({
  args: { periodLabel: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const pools = await ctx.db.query("reviewerFundPool").collect();
    const pool = pools[0];
    if (!pool || pool.balance <= 0) {
      throw new Error("No funds available for distribution");
    }

    const existingDist = await ctx.db
      .query("reviewerFundDistributions")
      .withIndex("by_period", (q) => q.eq("periodLabel", args.periodLabel))
      .first();
    if (existingDist) {
      throw new Error(`Distribution for period "${args.periodLabel}" already exists`);
    }

    const allRep = await ctx.db.query("userReputation").collect();
    const eligible = allRep.filter((r) => r.level >= MIN_ELIGIBILITY_LEVEL);

    if (eligible.length === 0) {
      throw new Error("No eligible reviewers found (Level 2+ required)");
    }

    const scored = eligible.map((r) => ({
      userId: r.userId,
      weightedScore:
        r.helpfulnessScore * Math.sqrt(r.reviewCount) * (1 + r.karma / 1000),
    }));

    const totalScore = scored.reduce((sum, s) => sum + s.weightedScore, 0);
    if (totalScore <= 0) {
      throw new Error("No reviewers with positive quality scores");
    }

    scored.sort((a, b) => b.weightedScore - a.weightedScore);

    const poolSnapshot = pool.balance;
    let totalDistributed = 0;
    const distributions: Array<{
      userId: string;
      amount: number;
      qualityScore: number;
      rank: number;
    }> = [];

    for (let i = 0; i < scored.length; i++) {
      const reviewer = scored[i];
      const share = Math.floor(
        (reviewer.weightedScore / totalScore) * poolSnapshot
      );
      if (share <= 0) continue;

      distributions.push({
        userId: reviewer.userId,
        amount: share,
        qualityScore: reviewer.weightedScore,
        rank: i + 1,
      });
      totalDistributed += share;
    }

    if (distributions.length === 0) {
      throw new Error("Pool balance too small to distribute any Credits to reviewers");
    }

    for (const dist of distributions) {
      await ctx.db.insert("reviewerFundDistributions", {
        periodLabel: args.periodLabel,
        userId: dist.userId,
        amount: dist.amount,
        qualityScore: dist.qualityScore,
        rank: dist.rank,
        totalEligible: eligible.length,
        poolSnapshot,
        createdAt: Date.now(),
      });

      const userBalance = await ctx.db
        .query("starBalances")
        .withIndex("by_user", (q) => q.eq("userId", dist.userId))
        .first();

      if (userBalance) {
        await ctx.db.patch(userBalance._id, {
          balance: userBalance.balance + dist.amount,
          totalReceived: userBalance.totalReceived + dist.amount,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("starBalances", {
          userId: dist.userId,
          balance: dist.amount,
          totalPurchased: 0,
          totalSent: 0,
          totalReceived: dist.amount,
          updatedAt: Date.now(),
        });
      }

      await ctx.db.insert("starTransactions", {
        userId: dist.userId,
        type: "reviewer_fund" as any,
        amount: dist.amount,
        referenceId: args.periodLabel,
        description: `Reviewer Fund distribution: ${dist.amount} Credits (rank #${dist.rank})`,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(pool._id, {
      balance: pool.balance - totalDistributed,
      totalDistributed: pool.totalDistributed + totalDistributed,
      distributionCount: pool.distributionCount + 1,
      lastDistributionAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      periodLabel: args.periodLabel,
      totalDistributed,
      recipientCount: distributions.length,
      remainingPool: pool.balance - totalDistributed,
      distributions: distributions.map((d) => ({
        userId: d.userId,
        amount: d.amount,
        rank: d.rank,
      })),
    };
  },
});
