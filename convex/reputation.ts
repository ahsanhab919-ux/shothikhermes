import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

export const getUserReputation = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const rep = await ctx.db
      .query("userReputation")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!rep) {
      return {
        userId: args.userId,
        karma: 0,
        reviewCount: 0,
        helpfulnessScore: 0,
        level: 0,
      };
    }

    return rep;
  },
});

export const getTopContributors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("userReputation").collect();
    return all
      .sort((a, b) => b.karma - a.karma)
      .slice(0, args.limit ?? 10);
  },
});

export const updateReputation = mutation({
  args: {
    karmaChange: v.number(),
    reviewCountChange: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const rep = await ctx.db
      .query("userReputation")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (rep) {
      const newKarma = rep.karma + args.karmaChange;
      const newReviewCount = rep.reviewCount + (args.reviewCountChange ?? 0);
      const newLevel = Math.min(5, Math.floor(newKarma / 100));
      await ctx.db.patch(rep._id, {
        karma: newKarma,
        reviewCount: newReviewCount,
        level: newLevel,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userReputation", {
        userId,
        karma: Math.max(0, args.karmaChange),
        reviewCount: args.reviewCountChange ?? 0,
        helpfulnessScore: 0,
        level: 0,
        updatedAt: Date.now(),
      });
    }
  },
});
