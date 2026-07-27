import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function getAuthenticatedUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

export const createForum = mutation({
  args: {
    bookId: v.optional(v.id("books")),
    twinId: v.id("twins"),
    title: v.string(),
    description: v.optional(v.string()),
    participantType: v.union(v.literal("agent_only"), v.literal("human_only"), v.literal("both")),
    publicationDate: v.optional(v.number()),
    coverImageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== callerId) throw new Error("Unauthorized: you do not own this twin");
    const now = Date.now();
    return await ctx.db.insert("forums", {
      bookId: args.bookId,
      twinId: args.twinId,
      masterId: callerId,
      title: args.title,
      description: args.description,
      participantType: args.participantType,
      status: "open",
      publicationDate: args.publicationDate,
      reservationCount: 0,
      coverImageUrl: args.coverImageUrl,
      category: args.category,
      language: args.language,
      postCount: 0,
      lastActivityAt: now,
      createdAt: now,
    });
  },
});

export const getForumById = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.forumId);
  },
});

export const getForumsByAgent = query({
  args: { agentId: v.union(v.id("twins"), v.id("agents")) },
  handler: async (ctx, args) => {
    const twinId = args.agentId as unknown as import("./_generated/dataModel").Id<"twins">;
    const byTwin = await ctx.db
      .query("forums")
      .withIndex("by_twin", (q) => q.eq("twinId", twinId))
      .order("desc")
      .collect();
    if (byTwin.length > 0) return byTwin;
    const agentId = args.agentId as unknown as import("./_generated/dataModel").Id<"agents">;
    return await ctx.db
      .query("forums")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .order("desc")
      .collect();
  },
});

export const getOpenForums = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forums")
      .withIndex("by_last_activity")
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "open"))
      .take(args.limit ?? 20);
  },
});

export const getForumsDroppingSoon = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const in48h = now + 48 * 60 * 60 * 1000;
    const forums = await ctx.db
      .query("forums")
      .withIndex("by_publication_date")
      .order("asc")
      .filter((q) =>
        q.and(
          q.gte(q.field("publicationDate"), now),
          q.lte(q.field("publicationDate"), in48h),
          q.eq(q.field("status"), "open")
        )
      )
      .take(10);
    return forums;
  },
});

export const getForumsRecentlyPublished = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return await ctx.db
      .query("forums")
      .withIndex("by_last_activity")
      .order("desc")
      .filter((q) =>
        q.and(q.eq(q.field("status"), "published"), q.gte(q.field("lastActivityAt"), since))
      )
      .take(10);
  },
});

export const closeForum = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");
    if (forum.masterId !== callerId) throw new Error("Unauthorized: only the forum owner can close it");
    await ctx.db.patch(args.forumId, { status: "closed" });
  },
});

export const markForumPublished = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");
    if (forum.masterId !== callerId) throw new Error("Unauthorized: only the forum owner can publish it");
    await ctx.db.patch(args.forumId, { status: "published", lastActivityAt: Date.now() });
  },
});

export const createPost = mutation({
  args: {
    forumId: v.id("forums"),
    authorName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") {
      throw new Error("forum_closed");
    }
    if (forum.participantType === "agent_only") {
      throw new Error("agent_only_forum");
    }
    if (args.content.length > 2000) {
      throw new Error("content_too_long");
    }

    let shareToken = generateShareToken();
    const existing = await ctx.db
      .query("forum_posts")
      .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
      .first();
    if (existing) shareToken = generateShareToken() + Date.now().toString(36);

    const postId = await ctx.db.insert("forum_posts", {
      forumId: args.forumId,
      authorId: callerId,
      authorType: "human",
      authorName: args.authorName,
      content: args.content,
      shareToken,
      reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.forumId, {
      postCount: (forum.postCount ?? 0) + 1,
      lastActivityAt: Date.now(),
    });

    return postId;
  },
});

export const getForumPosts = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forum_posts")
      .withIndex("by_forum_time", (q) => q.eq("forumId", args.forumId))
      .order("asc")
      .collect();
  },
});

export const getPostByShareToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forum_posts")
      .withIndex("by_share_token", (q) => q.eq("shareToken", args.shareToken))
      .first();
  },
});

export const reactToPost = mutation({
  args: {
    postId: v.id("forum_posts"),
    forumId: v.id("forums"),
    reactionType: v.union(
      v.literal("intrigued"),
      v.literal("skeptical"),
      v.literal("impressed"),
      v.literal("unsettled")
    ),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("forum_reactions")
      .withIndex("by_reactor_post", (q) =>
        q.eq("reactorId", callerId).eq("postId", args.postId)
      )
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) return;

    if (existing) {
      if (existing.reactionType === args.reactionType) {
        await ctx.db.delete(existing._id);
        const updated = { ...post.reactions };
        updated[args.reactionType] = Math.max(0, (updated[args.reactionType] ?? 0) - 1);
        await ctx.db.patch(args.postId, { reactions: updated });
        return "removed";
      } else {
        const updated = { ...post.reactions };
        updated[existing.reactionType] = Math.max(0, (updated[existing.reactionType] ?? 0) - 1);
        updated[args.reactionType] = (updated[args.reactionType] ?? 0) + 1;
        await ctx.db.patch(args.postId, { reactions: updated });
        await ctx.db.patch(existing._id, { reactionType: args.reactionType });
        return "changed";
      }
    } else {
      await ctx.db.insert("forum_reactions", {
        postId: args.postId,
        forumId: args.forumId,
        reactorId: callerId,
        reactorType: "human",
        reactionType: args.reactionType,
        createdAt: Date.now(),
      });
      const updated = { ...post.reactions };
      updated[args.reactionType] = (updated[args.reactionType] ?? 0) + 1;
      await ctx.db.patch(args.postId, { reactions: updated });
      return "added";
    }
  },
});

export const reserveForum = mutation({
  args: {
    forumId: v.id("forums"),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);

    const existing = await ctx.db
      .query("forum_reservations")
      .withIndex("by_forum_reserver", (q) =>
        q.eq("forumId", args.forumId).eq("reserverId", callerId)
      )
      .first();
    if (existing) return false;

    await ctx.db.insert("forum_reservations", {
      forumId: args.forumId,
      reserverId: callerId,
      reserverType: "human",
      earlyReaderBadge: false,
      createdAt: Date.now(),
    });

    const forum = await ctx.db.get(args.forumId);
    if (forum) {
      await ctx.db.patch(args.forumId, { reservationCount: (forum.reservationCount ?? 0) + 1 });
    }
    return true;
  },
});

export const hasReserved = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return false;
    const existing = await ctx.db
      .query("forum_reservations")
      .withIndex("by_forum_reserver", (q) =>
        q.eq("forumId", args.forumId).eq("reserverId", identity.subject)
      )
      .first();
    return !!existing;
  },
});

export const grantEarlyReaderBadges = mutation({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");
    if (forum.masterId !== callerId) throw new Error("Unauthorized: only the forum owner can grant badges");
    const reservations = await ctx.db
      .query("forum_reservations")
      .withIndex("by_forum", (q) => q.eq("forumId", args.forumId))
      .collect();
    for (const r of reservations) {
      await ctx.db.patch(r._id, { earlyReaderBadge: true });
    }
    return reservations.length;
  },
});

export const hasEarlyReaderBadge = query({
  args: { forumId: v.id("forums") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return false;
    const r = await ctx.db
      .query("forum_reservations")
      .withIndex("by_forum_reserver", (q) =>
        q.eq("forumId", args.forumId).eq("reserverId", identity.subject)
      )
      .first();
    return r?.earlyReaderBadge ?? false;
  },
});

export const addChatMessage = mutation({
  args: {
    forumId: v.id("forums"),
    authorName: v.string(),
    message: v.string(),
    replyToId: v.optional(v.id("forum_chat")),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") throw new Error("forum_closed");
    if (forum.participantType === "agent_only") throw new Error("agent_only_forum");
    if (args.message.length > 1000) throw new Error("message_too_long");
    const msgId = await ctx.db.insert("forum_chat", {
      forumId: args.forumId,
      authorId: callerId,
      authorType: "human",
      authorName: args.authorName,
      message: args.message,
      replyToId: args.replyToId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.forumId, { lastActivityAt: Date.now() });
    return msgId;
  },
});

export const createPostInternal = internalMutation({
  args: {
    forumId: v.id("forums"),
    authorId: v.string(),
    authorType: v.union(v.literal("human"), v.literal("agent")),
    authorName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") throw new Error("forum_closed");
    if (forum.participantType === "human_only" && args.authorType === "agent") throw new Error("agent_not_permitted");
    if (args.content.length > 2000) throw new Error("content_too_long");

    let shareToken = generateShareToken();
    const existing = await ctx.db
      .query("forum_posts")
      .withIndex("by_share_token", (q) => q.eq("shareToken", shareToken))
      .first();
    if (existing) shareToken = generateShareToken() + Date.now().toString(36);

    const postId = await ctx.db.insert("forum_posts", {
      forumId: args.forumId,
      authorId: args.authorId,
      authorType: args.authorType,
      authorName: args.authorName,
      content: args.content,
      shareToken,
      reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.forumId, {
      postCount: (forum.postCount ?? 0) + 1,
      lastActivityAt: Date.now(),
    });
    return postId;
  },
});

export const reactToPostInternal = internalMutation({
  args: {
    postId: v.id("forum_posts"),
    forumId: v.id("forums"),
    reactorId: v.string(),
    reactorType: v.union(v.literal("human"), v.literal("agent")),
    reactionType: v.union(
      v.literal("intrigued"),
      v.literal("skeptical"),
      v.literal("impressed"),
      v.literal("unsettled")
    ),
  },
  handler: async (ctx, args) => {
    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") throw new Error("forum_closed");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post_not_found");
    const existing = await ctx.db
      .query("forum_reactions")
      .withIndex("by_reactor_post", (q) => q.eq("reactorId", args.reactorId).eq("postId", args.postId))
      .first();
    if (existing) {
      if (existing.reactionType === args.reactionType) {
        await ctx.db.delete(existing._id);
        await ctx.db.patch(args.postId, {
          reactions: {
            ...post.reactions,
            [args.reactionType]: Math.max(0, (post.reactions?.[args.reactionType] ?? 1) - 1),
          },
        });
        return "removed";
      }
      const oldType = existing.reactionType;
      await ctx.db.patch(existing._id, { reactionType: args.reactionType });
      await ctx.db.patch(args.postId, {
        reactions: {
          ...post.reactions,
          [oldType]: Math.max(0, (post.reactions?.[oldType] ?? 1) - 1),
          [args.reactionType]: (post.reactions?.[args.reactionType] ?? 0) + 1,
        },
      });
      return "changed";
    }
    await ctx.db.insert("forum_reactions", {
      postId: args.postId,
      forumId: args.forumId,
      reactorId: args.reactorId,
      reactorType: args.reactorType,
      reactionType: args.reactionType,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.postId, {
      reactions: {
        ...post.reactions,
        [args.reactionType]: (post.reactions?.[args.reactionType] ?? 0) + 1,
      },
    });
    return "added";
  },
});

export const addChatMessageInternal = internalMutation({
  args: {
    forumId: v.id("forums"),
    authorId: v.string(),
    authorType: v.union(v.literal("human"), v.literal("agent")),
    authorName: v.string(),
    message: v.string(),
    replyToId: v.optional(v.id("forum_chat")),
  },
  handler: async (ctx, args) => {
    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") throw new Error("forum_closed");
    if (forum.participantType === "human_only" && args.authorType === "agent") throw new Error("agent_not_permitted");
    if (args.message.length > 1000) throw new Error("message_too_long");
    const msgId = await ctx.db.insert("forum_chat", {
      forumId: args.forumId,
      authorId: args.authorId,
      authorType: args.authorType,
      authorName: args.authorName,
      message: args.message,
      replyToId: args.replyToId,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.forumId, { lastActivityAt: Date.now() });
    return msgId;
  },
});

export const getChatMessages = query({
  args: { forumId: v.id("forums"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("forum_chat")
      .withIndex("by_forum_time", (q) => q.eq("forumId", args.forumId))
      .order("asc")
      .take(args.limit ?? 100);
  },
});

export const getAllForumsSorted = query({
  args: {
    sortBy: v.union(v.literal("hot"), v.literal("new"), v.literal("top")),
    channelSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let forums;
    if (args.channelSlug) {
      forums = await ctx.db
        .query("forums")
        .withIndex("by_channel", (q) => q.eq("channelSlug", args.channelSlug))
        .collect();
    } else {
      forums = await ctx.db
        .query("forums")
        .withIndex("by_last_activity")
        .order("desc")
        .collect();
    }

    const now = Date.now();
    const sorted = forums.sort((a, b) => {
      switch (args.sortBy) {
        case "hot": {
          const ageA = (now - a.createdAt) / (1000 * 60 * 60);
          const ageB = (now - b.createdAt) / (1000 * 60 * 60);
          const scoreA = (a.postCount * 2 + a.reservationCount) / Math.pow(ageA + 2, 1.5);
          const scoreB = (b.postCount * 2 + b.reservationCount) / Math.pow(ageB + 2, 1.5);
          return scoreB - scoreA;
        }
        case "new":
          return b.createdAt - a.createdAt;
        case "top":
          return (b.postCount + b.reservationCount) - (a.postCount + a.reservationCount);
        default:
          return 0;
      }
    });

    return sorted.slice(0, args.limit ?? 30);
  },
});

export const tipAgent = mutation({
  args: {
    forumId: v.id("forums"),
    postId: v.optional(v.id("forum_posts")),
    toTwinId: v.id("twins"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthenticatedUserId(ctx);
    if (args.amount <= 0) throw new Error("invalid_amount");
    const twin = await ctx.db.get(args.toTwinId);
    if (twin && twin.masterId === callerId) throw new Error("self_tip_not_allowed");
    await ctx.db.insert("forum_tips", {
      forumId: args.forumId,
      postId: args.postId,
      fromId: callerId,
      fromType: "human",
      toTwinId: args.toTwinId,
      amount: args.amount,
      createdAt: Date.now(),
    });
    return true;
  },
});
