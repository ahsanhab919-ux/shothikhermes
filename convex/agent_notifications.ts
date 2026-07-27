import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createNotification = mutation({
  args: {
    masterId: v.string(),
    twinId: v.optional(v.id("twins")),
    agentId: v.optional(v.id("agents")),
    agentName: v.optional(v.string()),
    type: v.union(
      v.literal("format_complete"),
      v.literal("review_needed"),
      v.literal("forum_opened"),
      v.literal("revision_requested"),
      v.literal("distribution_failed"),
      v.literal("distribution_submitted")
    ),
    bookId: v.optional(v.id("books")),
    bookTitle: v.optional(v.string()),
    forumId: v.optional(v.string()),
    message: v.string(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let twinId = args.twinId;
    let agentName = args.agentName;
    if (twinId) {
      const twin = await ctx.db.get(twinId);
      agentName = agentName || (twin ? twin.name : "System");
    } else {
      const firstTwin = await ctx.db.query("twins").first();
      twinId = firstTwin ? firstTwin._id : undefined;
      agentName = agentName || (firstTwin ? firstTwin.name : "System");
    }
    return await ctx.db.insert("agent_notifications", {
      masterId: args.masterId,
      twinId,
      agentName,
      type: args.type,
      bookId: args.bookId,
      bookTitle: args.bookTitle,
      forumId: args.forumId,
      message: args.message,
      feedback: args.feedback,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const getMasterNotifications = query({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_notifications")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .order("desc")
      .take(50);
  },
});

export const getUnreadCount = query({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("agent_notifications")
      .withIndex("by_master_unread", (q) => q.eq("masterId", args.masterId).eq("read", false))
      .collect();
    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("agent_notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

export const markAllAsRead = mutation({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("agent_notifications")
      .withIndex("by_master_unread", (q) => q.eq("masterId", args.masterId).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return unread.length;
  },
});
