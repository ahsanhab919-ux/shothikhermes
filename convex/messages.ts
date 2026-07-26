import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUserId(ctx: any): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) throw new Error("Authentication required");
  return identity.subject;
}

async function requireConversation(ctx: any, conversationId: any, userId: string) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.userId !== userId) {
    throw new Error("Conversation not found");
  }
  return conversation;
}

async function requireMessage(ctx: any, messageId: any, userId: string) {
  const message = await ctx.db.get(messageId);
  if (!message || message.userId !== userId) {
    throw new Error("Message not found");
  }
  return message;
}

function compactPreview(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function insertMessage(ctx: any, args: any) {
  const now = Date.now();
  return await ctx.db.insert("messages", {
    conversationId: args.conversationId,
    userId: args.userId,
    role: args.role,
    content: args.content ?? "",
    contentFormat: args.contentFormat ?? "plain",
    status: args.status ?? "completed",
    modelHandle: args.modelHandle,
    parentMessageId: args.parentMessageId,
    metadata: args.metadata,
    createdAt: now,
    updatedAt: now,
  });
}

async function touchConversation(ctx: any, conversationId: any, content: string, modelHandle?: string, delta = 1) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) return;
  const now = Date.now();
  await ctx.db.patch(conversationId, {
    lastMessageAt: now,
    lastMessagePreview: compactPreview(content),
    modelHandle: modelHandle ?? conversation.modelHandle,
    messageCount: Math.max(0, (conversation.messageCount ?? 0) + delta),
    updatedAt: now,
  });
}

async function syncConversationAfterMessageDelete(ctx: any, conversationId: any) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) return;

  const remainingMessages = await ctx.db
    .query("messages")
    .withIndex("by_conversation_created", (q: any) => q.eq("conversationId", conversationId))
    .order("asc")
    .collect();

  const lastMessage = remainingMessages[remainingMessages.length - 1];
  const now = Date.now();

  await ctx.db.patch(conversationId, {
    messageCount: remainingMessages.length,
    lastMessagePreview: lastMessage ? compactPreview(lastMessage.content ?? "") : undefined,
    lastMessageAt: lastMessage
      ? ((lastMessage.updatedAt ?? lastMessage.createdAt) as number)
      : conversation.createdAt,
    modelHandle: lastMessage?.modelHandle ?? conversation.modelHandle,
    updatedAt: now,
  });
}

export const listMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireConversation(ctx, args.conversationId, userId);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q: any) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    return rows.slice(-Math.max(1, Math.min(args.limit ?? 200, 500)));
  },
});

export const listMessagesInternal = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireConversation(ctx, args.conversationId, args.userId);
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversation_created", (q: any) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    return rows.slice(-Math.max(1, Math.min(args.limit ?? 200, 500)));
  },
});

export const appendUserMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    contentFormat: v.optional(v.union(v.literal("markdown"), v.literal("plain"))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireConversation(ctx, args.conversationId, userId);
    const id = await insertMessage(ctx, {
      ...args,
      userId,
      role: "user",
      status: "completed",
    });
    await touchConversation(ctx, args.conversationId, args.content);
    return await ctx.db.get(id);
  },
});

export const appendAssistantPlaceholder = mutation({
  args: {
    conversationId: v.id("conversations"),
    modelHandle: v.optional(v.string()),
    parentMessageId: v.optional(v.id("messages")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireConversation(ctx, args.conversationId, userId);
    const id = await insertMessage(ctx, {
      conversationId: args.conversationId,
      userId,
      role: "assistant",
      content: "",
      contentFormat: "markdown",
      status: "streaming",
      modelHandle: args.modelHandle,
      parentMessageId: args.parentMessageId,
      metadata: args.metadata,
    });
    await touchConversation(ctx, args.conversationId, "", args.modelHandle);
    return await ctx.db.get(id);
  },
});

export const appendUserMessageInternal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    content: v.string(),
    contentFormat: v.optional(v.union(v.literal("markdown"), v.literal("plain"))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireConversation(ctx, args.conversationId, args.userId);
    const id = await insertMessage(ctx, {
      ...args,
      role: "user",
      status: "completed",
    });
    await touchConversation(ctx, args.conversationId, args.content);
    return await ctx.db.get(id);
  },
});

export const appendAssistantPlaceholderInternal = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    modelHandle: v.optional(v.string()),
    parentMessageId: v.optional(v.id("messages")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireConversation(ctx, args.conversationId, args.userId);
    const id = await insertMessage(ctx, {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "assistant",
      content: "",
      contentFormat: "markdown",
      status: "streaming",
      modelHandle: args.modelHandle,
      parentMessageId: args.parentMessageId,
      metadata: args.metadata,
    });
    await touchConversation(ctx, args.conversationId, "", args.modelHandle);
    return await ctx.db.get(id);
  },
});

export const appendAssistantChunk = mutation({
  args: {
    messageId: v.id("messages"),
    delta: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = await requireMessage(ctx, args.messageId, userId);
    const nextContent = `${message.content || ""}${args.delta}`;
    await ctx.db.patch(args.messageId, {
      content: nextContent,
      updatedAt: Date.now(),
    });
    await touchConversation(ctx, message.conversationId, nextContent, message.modelHandle, 0);
    return await ctx.db.get(args.messageId);
  },
});

export const appendAssistantChunkInternal = internalMutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    delta: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await requireMessage(ctx, args.messageId, args.userId);
    const nextContent = `${message.content || ""}${args.delta}`;
    await ctx.db.patch(args.messageId, {
      content: nextContent,
      updatedAt: Date.now(),
    });
    await touchConversation(ctx, message.conversationId, nextContent, message.modelHandle, 0);
    return await ctx.db.get(args.messageId);
  },
});

export const completeAssistantMessage = mutation({
  args: {
    messageId: v.id("messages"),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = await requireMessage(ctx, args.messageId, userId);
    await ctx.db.patch(args.messageId, {
      status: "completed",
      metadata: args.metadata ?? message.metadata,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});

export const completeAssistantMessageInternal = internalMutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const message = await requireMessage(ctx, args.messageId, args.userId);
    await ctx.db.patch(args.messageId, {
      status: "completed",
      metadata: args.metadata ?? message.metadata,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});

export const stopAssistantMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireMessage(ctx, args.messageId, userId);
    await ctx.db.patch(args.messageId, {
      status: "stopped",
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});

export const stopAssistantMessageInternal = internalMutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireMessage(ctx, args.messageId, args.userId);
    await ctx.db.patch(args.messageId, {
      status: "stopped",
      updatedAt: Date.now(),
    });
    return await ctx.db.get(args.messageId);
  },
});

export const failAssistantMessage = mutation({
  args: {
    messageId: v.id("messages"),
    errorCode: v.optional(v.string()),
    fallbackText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = await requireMessage(ctx, args.messageId, userId);
    const content = args.fallbackText ?? message.content ?? "Something went wrong.";
    await ctx.db.patch(args.messageId, {
      content,
      status: "error",
      metadata: {
        ...(message.metadata ?? {}),
        ...(args.errorCode ? { errorCode: args.errorCode } : {}),
      },
      updatedAt: Date.now(),
    });
    await touchConversation(ctx, message.conversationId, content, message.modelHandle, 0);
    return await ctx.db.get(args.messageId);
  },
});

export const failAssistantMessageInternal = internalMutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    errorCode: v.optional(v.string()),
    fallbackText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = await requireMessage(ctx, args.messageId, args.userId);
    const content = args.fallbackText ?? message.content ?? "Something went wrong.";
    await ctx.db.patch(args.messageId, {
      content,
      status: "error",
      metadata: {
        ...(message.metadata ?? {}),
        ...(args.errorCode ? { errorCode: args.errorCode } : {}),
      },
      updatedAt: Date.now(),
    });
    await touchConversation(ctx, message.conversationId, content, message.modelHandle, 0);
    return await ctx.db.get(args.messageId);
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const message = await requireMessage(ctx, args.messageId, userId);
    await requireConversation(ctx, message.conversationId, userId);
    await ctx.db.delete(args.messageId);
    await syncConversationAfterMessageDelete(ctx, message.conversationId);
    return { success: true };
  },
});

export const deleteMessageInternal = internalMutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await requireMessage(ctx, args.messageId, args.userId);
    await requireConversation(ctx, message.conversationId, args.userId);
    await ctx.db.delete(args.messageId);
    await syncConversationAfterMessageDelete(ctx, message.conversationId);
    return { success: true };
  },
});
