/**
 * Convex data layer for the Second Me persistence satellites (engine Step 3a).
 *
 * These are the storage primitives that `lib/second-me/key-custody.ts` and
 * `lib/writingProfile.ts` call over the Convex admin HTTP API (deploy key),
 * following the same transactional, mockable pattern as `convex/bookService.ts`.
 *
 * They operate on the additive `secondMeKeyCustody` and `writingProfiles`
 * tables. They ADD nothing to the twins subsystem's behavior.
 *
 * SECURITY: `secondMeKeyCustody` is keyed by {userId, purpose} and only ever
 * stores a sealed vault envelope. There is no twinId here by design — a twin
 * transfer must never carry the previous owner's keys. This layer never opens
 * an envelope; sealing/opening happens in the lib layer via crypto-vault.
 */
import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// --- key custody (BYOK-at-rest) ---

export const upsertKeyCustody = internalMutation({
  args: {
    userId: v.string(),
    purpose: v.string(),
    sealedKey: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Upsert by (userId, purpose), mirroring the engine's Mongoose
    // findOneAndUpdate({userId, purpose}, ..., {upsert:true}) — a single
    // transactional read + conditional write.
    const existing = await ctx.db
      .query("secondMeKeyCustody")
      .withIndex("by_user_purpose", (q) =>
        q.eq("userId", args.userId).eq("purpose", args.purpose)
      )
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        sealedKey: args.sealedKey,
        provider: args.provider,
        updatedAt: now,
      });
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert("secondMeKeyCustody", {
      userId: args.userId,
      purpose: args.purpose,
      sealedKey: args.sealedKey,
      provider: args.provider,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const listKeyCustody = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("secondMeKeyCustody")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getKeyCustody = internalQuery({
  args: { userId: v.string(), purpose: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("secondMeKeyCustody")
      .withIndex("by_user_purpose", (q) =>
        q.eq("userId", args.userId).eq("purpose", args.purpose)
      )
      .first();
  },
});

export const deleteKeyCustody = internalMutation({
  args: { userId: v.string(), purpose: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("secondMeKeyCustody")
      .withIndex("by_user_purpose", (q) =>
        q.eq("userId", args.userId).eq("purpose", args.purpose)
      )
      .first();
    if (!existing) return { deleted: false as const };
    await ctx.db.delete(existing._id);
    return { deleted: true as const };
  },
});

// --- writing profile (one Letta writing agent per user) ---

export const getWritingProfile = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("writingProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createWritingProfile = internalMutation({
  args: {
    userId: v.string(),
    lettaAgentId: v.string(),
    blockLabel: v.string(),
    modelHandle: v.optional(v.string()),
    embeddingHandle: v.optional(v.string()),
    lastContentLength: v.number(),
  },
  handler: async (ctx, args) => {
    // Preserve the "one agent per user" invariant: if a row raced in ahead of
    // us, return it instead of inserting a duplicate.
    const existing = await ctx.db
      .query("writingProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing;
    const now = Date.now();
    const id = await ctx.db.insert("writingProfiles", {
      userId: args.userId,
      lettaAgentId: args.lettaAgentId,
      blockLabel: args.blockLabel,
      modelHandle: args.modelHandle,
      embeddingHandle: args.embeddingHandle,
      lastContentLength: args.lastContentLength,
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});
