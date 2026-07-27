import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const createBuild = mutation({
  args: {
    buildId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("latexBuilds", {
      buildId: args.buildId,
      userId: args.userId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateBuild = mutation({
  args: {
    buildId: v.string(),
    status: v.string(),
    pdfUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("latexBuilds")
      .withIndex("by_build_id", (q) => q.eq("buildId", args.buildId))
      .first();

    if (!existing) return null;

    await ctx.db.patch(existing._id, {
      status: args.status,
      pdfUrl: args.pdfUrl,
      error: args.error,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

export const getBuild = query({
  args: { buildId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("latexBuilds")
      .withIndex("by_build_id", (q) => q.eq("buildId", args.buildId))
      .first();
  },
});

export const purgeOldBuilds = mutation({
  args: { olderThanMs: v.number() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.olderThanMs;
    const old = await ctx.db
      .query("latexBuilds")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoff))
      .take(100);

    let deleted = 0;
    for (const build of old) {
      await ctx.db.delete(build._id);
      deleted++;
    }
    return { deleted };
  },
});

