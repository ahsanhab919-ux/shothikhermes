import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

function trimTitle(input?: string | null): string {
  const title = typeof input === "string" ? input.trim() : "";
  return title || "New chat";
}

function toPreview(input?: string | null): string | undefined {
  if (typeof input !== "string") return undefined;
  const compact = input.replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 240) : undefined;
}

async function requireUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

async function getConversationForUser(ctx: any, conversationId: any, userId: string) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.userId !== userId) {
    throw new Error("Conversation not found");
  }
  return conversation;
}

async function insertConversation(ctx: any, userId: string, args: any) {
  const now = Date.now();
  const title = trimTitle(args.title);
  return await ctx.db.insert("conversations", {
    userId,
    surface: args.surface,
    title,
    status: "active",
    pinned: false,
    temporary: args.temporary ?? false,
    modelHandle: args.modelHandle,
    contextRef: args.contextRef,
    lastMessageAt: now,
    lastMessagePreview: undefined,
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export const createConversation = mutation({
  args: {
    surface: v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    ),
    title: v.optional(v.string()),
    modelHandle: v.optional(v.string()),
    temporary: v.optional(v.boolean()),
    contextRef: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      bookId: v.optional(v.id("books")),
      sheetId: v.optional(v.string()),
      researchId: v.optional(v.string()),
      localProjectId: v.optional(v.string()),
      agentType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const id = await insertConversation(ctx, userId, args);
    return await ctx.db.get(id);
  },
});

export const createConversationInternal = internalMutation({
  args: {
    userId: v.string(),
    surface: v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    ),
    title: v.optional(v.string()),
    modelHandle: v.optional(v.string()),
    temporary: v.optional(v.boolean()),
    contextRef: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      bookId: v.optional(v.id("books")),
      sheetId: v.optional(v.string()),
      researchId: v.optional(v.string()),
      localProjectId: v.optional(v.string()),
      agentType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const id = await insertConversation(ctx, args.userId, args);
    return await ctx.db.get(id);
  },
});

export const listConversations = query({
  args: {
    surface: v.optional(v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    )),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted")
    )),
    includeTemporary: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return rows
      .filter((row: any) => !args.surface || row.surface === args.surface)
      .filter((row: any) => {
        if (args.status) return row.status === args.status;
        return row.status !== "deleted";
      })
      .filter((row: any) => args.includeTemporary ? true : !row.temporary)
      .slice(0, Math.max(1, Math.min(args.limit ?? 50, 200)));
  },
});

export const listConversationsInternal = internalQuery({
  args: {
    userId: v.string(),
    surface: v.optional(v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    )),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted")
    )),
    includeTemporary: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const needle = args.query?.trim().toLowerCase();

    return rows
      .filter((row: any) => !args.surface || row.surface === args.surface)
      .filter((row: any) => {
        if (args.status) return row.status === args.status;
        return row.status !== "deleted";
      })
      .filter((row: any) => args.includeTemporary ? true : !row.temporary)
      .filter((row: any) => {
        if (!needle) return true;
        const haystacks = [row.title, row.lastMessagePreview]
          .filter(Boolean)
          .map((value: string) => value.toLowerCase());
        return haystacks.some((value: string) => value.includes(needle));
      })
      .slice(0, Math.max(1, Math.min(args.limit ?? (needle ? 20 : 50), needle ? 100 : 200)));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return await getConversationForUser(ctx, args.conversationId, userId);
  },
});

export const getConversationInternal = internalQuery({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await getConversationForUser(ctx, args.conversationId, args.userId);
  },
});

export const renameConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getConversationForUser(ctx, args.conversationId, userId);
    await ctx.db.patch(args.conversationId, {
      title: trimTitle(args.title),
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.conversationId);
  },
});

export const updateConversationInternal = internalMutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await getConversationForUser(ctx, args.conversationId, args.userId);

    const patch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (typeof args.title === "string") {
      patch.title = trimTitle(args.title);
    }

    if (typeof args.pinned === "boolean") {
      patch.pinned = args.pinned;
    }

    if (typeof args.archived === "boolean") {
      patch.status = args.archived ? "archived" : "active";
    }

    await ctx.db.patch(args.conversationId, patch);
    return await ctx.db.get(args.conversationId);
  },
});

export const pinConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getConversationForUser(ctx, args.conversationId, userId);
    await ctx.db.patch(args.conversationId, {
      pinned: args.pinned,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.conversationId);
  },
});

export const archiveConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getConversationForUser(ctx, args.conversationId, userId);
    await ctx.db.patch(args.conversationId, {
      status: args.archived ? "archived" : "active",
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.conversationId);
  },
});

export const softDeleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await getConversationForUser(ctx, args.conversationId, userId);
    await ctx.db.patch(args.conversationId, {
      status: "deleted",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const softDeleteConversationInternal = internalMutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await getConversationForUser(ctx, args.conversationId, args.userId);
    await ctx.db.patch(args.conversationId, {
      status: "deleted",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const searchConversations = query({
  args: {
    query: v.string(),
    surface: v.optional(v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const needle = args.query.trim().toLowerCase();
    if (!needle) return [];

    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q: any) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return rows
      .filter((row: any) => row.status !== "deleted")
      .filter((row: any) => !args.surface || row.surface === args.surface)
      .filter((row: any) => {
        const haystacks = [row.title, row.lastMessagePreview].filter(Boolean).map((value: string) => value.toLowerCase());
        return haystacks.some((value: string) => value.includes(needle));
      })
      .slice(0, Math.max(1, Math.min(args.limit ?? 20, 100)));
  },
});

export const touchConversation = internalMutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    lastMessagePreview: v.optional(v.string()),
    modelHandle: v.optional(v.string()),
    messageCountDelta: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversation = await getConversationForUser(ctx, args.conversationId, args.userId);
    const now = Date.now();
    const nextCount = Math.max(0, (conversation.messageCount ?? 0) + (args.messageCountDelta ?? 0));
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: now,
      lastMessagePreview: toPreview(args.lastMessagePreview) ?? conversation.lastMessagePreview,
      modelHandle: args.modelHandle ?? conversation.modelHandle,
      messageCount: nextCount,
      updatedAt: now,
    });
    return await ctx.db.get(args.conversationId);
  },
});
