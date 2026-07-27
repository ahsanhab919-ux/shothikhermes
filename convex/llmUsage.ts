import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const trackUsage = mutation({
  args: {
    userId: v.string(),
    tool: v.string(),
    provider: v.string(),
    tokens: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("llmUsage", {
      userId: args.userId,
      tool: args.tool,
      provider: args.provider,
      tokens: args.tokens,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      costUsd: args.costUsd,
      timestamp: Date.now(),
    });
  },
});

export const getDailySpend = query({
  args: { daysBack: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 7;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const records = await ctx.db
      .query("llmUsage")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const byDay: Record<string, { tokens: number; costUsd: number; calls: number }> = {};
    for (const r of records) {
      const day = new Date(r.timestamp).toISOString().split("T")[0];
      if (!byDay[day]) byDay[day] = { tokens: 0, costUsd: 0, calls: 0 };
      byDay[day].tokens += r.tokens;
      byDay[day].costUsd += r.costUsd;
      byDay[day].calls += 1;
    }

    return byDay;
  },
});

export const getSpendByTool = query({
  args: { daysBack: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 30;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const records = await ctx.db
      .query("llmUsage")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const byTool: Record<string, { tokens: number; costUsd: number; calls: number }> = {};
    for (const r of records) {
      if (!byTool[r.tool]) byTool[r.tool] = { tokens: 0, costUsd: 0, calls: 0 };
      byTool[r.tool].tokens += r.tokens;
      byTool[r.tool].costUsd += r.costUsd;
      byTool[r.tool].calls += 1;
    }

    return byTool;
  },
});

export const getSpendByUser = query({
  args: { daysBack: v.optional(v.number()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 30;
    const limit = args.limit ?? 20;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const records = await ctx.db
      .query("llmUsage")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    const byUser: Record<string, { tokens: number; costUsd: number; calls: number }> = {};
    for (const r of records) {
      if (!byUser[r.userId]) byUser[r.userId] = { tokens: 0, costUsd: 0, calls: 0 };
      byUser[r.userId].tokens += r.tokens;
      byUser[r.userId].costUsd += r.costUsd;
      byUser[r.userId].calls += 1;
    }

    return Object.entries(byUser)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.costUsd - a.costUsd)
      .slice(0, limit);
  },
});

export const getTotalSpend = query({
  args: { daysBack: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 30;
    const since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
    const records = await ctx.db
      .query("llmUsage")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", since))
      .collect();

    return {
      totalCostUsd: records.reduce((s, r) => s + r.costUsd, 0),
      totalTokens: records.reduce((s, r) => s + r.tokens, 0),
      totalCalls: records.length,
    };
  },
});

