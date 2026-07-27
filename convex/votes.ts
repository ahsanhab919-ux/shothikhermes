import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

export const castVote = mutation({
  args: {
    targetType: v.union(v.literal("book"), v.literal("forum_post"), v.literal("forum")),
    targetId: v.string(),
    value: v.union(v.literal(1), v.literal(-1)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("votes")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", userId).eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .first();

    if (existing) {
      if (existing.value === args.value) {
        await ctx.db.delete(existing._id);
        return { action: "removed" as const };
      }
      await ctx.db.patch(existing._id, { value: args.value });
      return { action: "switched" as const };
    }

    await ctx.db.insert("votes", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      value: args.value,
      createdAt: Date.now(),
    });

    return { action: "created" as const };
  },
});

export const getVotesForTarget = query({
  args: {
    targetType: v.union(v.literal("book"), v.literal("forum_post"), v.literal("forum")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();

    const upvotes = votes.filter((v) => v.value === 1).length;
    const downvotes = votes.filter((v) => v.value === -1).length;

    return { upvotes, downvotes, score: upvotes - downvotes, total: votes.length };
  },
});

export const getVoteByUser = query({
  args: {
    targetType: v.union(v.literal("book"), v.literal("forum_post"), v.literal("forum")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return null;

    const vote = await ctx.db
      .query("votes")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", identity.subject).eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .first();

    return vote ? vote.value : null;
  },
});
