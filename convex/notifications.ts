import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createPublicNotification = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const payload = {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      createdAt,
    };

    const id = await ctx.db.insert("public_notifications", payload);
    await ctx.db.insert("notifications", payload);
    return id;
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      data: args.data,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const getUserNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    return await ctx.db
      .query("public_notifications")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getUnread = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) => q.eq("userId", args.userId).eq("read", false))
      .order("desc")
      .take(50);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return 0;
    const unread = await ctx.db
      .query("public_notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("userId", identity.subject).eq("read", false)
      )
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("public_notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const notif = await ctx.db.get(args.notificationId);
    if (!notif || notif.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const notif = await ctx.db.get(args.notificationId);
    if (!notif) throw new Error("Not found");
    if (identity?.subject && notif.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const unread = await ctx.db
      .query("public_notifications")
      .withIndex("by_user_unread", (q: any) =>
        q.eq("userId", identity.subject).eq("read", false)
      )
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return unread.length;
  },
});

export const markAllRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q: any) => q.eq("userId", args.userId).eq("read", false))
      .take(100);
    await Promise.all(unread.map((n: any) => ctx.db.patch(n._id, { read: true })));
    return { success: true };
  },
});
