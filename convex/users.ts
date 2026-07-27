import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const getUserPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (prefs) return prefs;

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q: any) => q.eq("userId", args.userId))
      .first();
    return user?.preferences ?? null;
  },
});

export const updateUserLocale = mutation({
  args: {
    userId: v.string(),
    locale: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        locale: args.locale,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userPreferences", {
        userId: args.userId,
        locale: args.locale,
        updatedAt: Date.now(),
      });
    }

    const user = await getOrCreateUserRow(ctx, args.userId);
    if (user) {
      await ctx.db.patch(user._id, {
        preferences: { ...(user.preferences ?? {}), locale: args.locale },
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();
  },
});

export const updateUserStripeCustomerId = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
