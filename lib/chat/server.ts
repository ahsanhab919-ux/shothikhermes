import { api } from "@/convex/_generated/api";
import { createConvexClientForUser } from "@/lib/convex/user-token";
import type {
  ChatMessage,
  ChatSurface,
  ChatSyncSnapshot,
  ConversationContextRef,
  ConversationStatus,
  ConversationSummary,
} from "./types";

function toConversation(row: any): ConversationSummary {
  return {
    _id: String(row._id),
    userId: String(row.userId),
    surface: row.surface,
    title: row.title,
    status: row.status,
    pinned: Boolean(row.pinned),
    temporary: Boolean(row.temporary),
    modelHandle: row.modelHandle ?? undefined,
    contextRef: row.contextRef ?? undefined,
    lastMessageAt: Number(row.lastMessageAt ?? Date.now()),
    lastMessagePreview: row.lastMessagePreview ?? undefined,
    messageCount: Number(row.messageCount ?? 0),
    createdAt: Number(row.createdAt ?? Date.now()),
    updatedAt: Number(row.updatedAt ?? Date.now()),
  };
}

function toMessage(row: any): ChatMessage {
  return {
    _id: String(row._id),
    conversationId: String(row.conversationId),
    userId: String(row.userId),
    role: row.role,
    content: row.content ?? "",
    contentFormat: row.contentFormat,
    status: row.status,
    modelHandle: row.modelHandle ?? undefined,
    parentMessageId: row.parentMessageId ? String(row.parentMessageId) : undefined,
    metadata: row.metadata ?? undefined,
    createdAt: Number(row.createdAt ?? Date.now()),
    updatedAt: Number(row.updatedAt ?? Date.now()),
  };
}

async function getChatConvexClient(userId: string) {
  return createConvexClientForUser({ _id: userId });
}

export async function listConversationsForUser(input: {
  userId: string;
  surface?: ChatSurface;
  status?: ConversationStatus;
  includeTemporary?: boolean;
  limit?: number;
  query?: string;
}) {
  const convex = await getChatConvexClient(input.userId);
  const rows = input.query?.trim()
    ? await convex.query(api.conversations.searchConversations, {
        query: input.query.trim(),
        ...(input.surface ? { surface: input.surface } : {}),
        ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
      })
    : await convex.query(api.conversations.listConversations, {
        ...(input.surface ? { surface: input.surface } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(typeof input.includeTemporary === "boolean"
          ? { includeTemporary: input.includeTemporary }
          : {}),
        ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
      });
  return rows.map(toConversation);
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const convex = await getChatConvexClient(userId);
  return toConversation(
    await convex.query(api.conversations.getConversation, {
      conversationId: conversationId as any,
    }),
  );
}

export async function createPersistedConversation(input: {
  userId: string;
  surface: ChatSurface;
  title?: string;
  modelHandle?: string;
  temporary?: boolean;
  contextRef?: ConversationContextRef;
}) {
  const convex = await getChatConvexClient(input.userId);
  return toConversation(
    await convex.mutation(api.conversations.createConversation, {
      surface: input.surface,
      ...(input.title ? { title: input.title } : {}),
      ...(input.modelHandle ? { modelHandle: input.modelHandle } : {}),
      ...(typeof input.temporary === "boolean" ? { temporary: input.temporary } : {}),
      ...(input.contextRef ? { contextRef: input.contextRef as any } : {}),
    }),
  );
}

export async function updateConversationForUser(input: {
  conversationId: string;
  userId: string;
  title?: string;
  pinned?: boolean;
  archived?: boolean;
}) {
  const convex = await getChatConvexClient(input.userId);
  const conversationId = input.conversationId as any;

  if (typeof input.title === "string") {
    await convex.mutation(api.conversations.renameConversation, {
      conversationId,
      title: input.title,
    });
  }

  if (typeof input.pinned === "boolean") {
    await convex.mutation(api.conversations.pinConversation, {
      conversationId,
      pinned: input.pinned,
    });
  }

  if (typeof input.archived === "boolean") {
    await convex.mutation(api.conversations.archiveConversation, {
      conversationId,
      archived: input.archived,
    });
  }

  return toConversation(
    await convex.query(api.conversations.getConversation, {
      conversationId,
    }),
  );
}

export async function softDeleteConversationForUser(conversationId: string, userId: string) {
  const convex = await getChatConvexClient(userId);
  return convex.mutation(api.conversations.softDeleteConversation, {
    conversationId: conversationId as any,
  });
}

export async function listMessagesForConversation(input: {
  conversationId: string;
  userId: string;
  limit?: number;
}) {
  const convex = await getChatConvexClient(input.userId);
  const rows = await convex.query(api.messages.listMessages, {
    conversationId: input.conversationId as any,
    ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
  });
  return rows.map(toMessage);
}

export async function appendPersistedUserMessage(input: {
  conversationId: string;
  userId: string;
  content: string;
  metadata?: ChatMessage["metadata"];
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.appendUserMessage, {
      conversationId: input.conversationId as any,
      content: input.content,
      metadata: input.metadata,
    }),
  );
}

export async function createPersistedAssistantMessage(input: {
  conversationId: string;
  userId: string;
  modelHandle?: string;
  parentMessageId?: string;
  metadata?: ChatMessage["metadata"];
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.appendAssistantPlaceholder, {
      conversationId: input.conversationId as any,
      ...(input.modelHandle ? { modelHandle: input.modelHandle } : {}),
      ...(input.parentMessageId ? { parentMessageId: input.parentMessageId as any } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
    }),
  );
}

export async function appendPersistedAssistantChunk(input: {
  messageId: string;
  userId: string;
  delta: string;
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.appendAssistantChunk, {
      messageId: input.messageId as any,
      delta: input.delta,
    }),
  );
}

export async function completePersistedAssistantMessage(input: {
  messageId: string;
  userId: string;
  metadata?: ChatMessage["metadata"];
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.completeAssistantMessage, {
      messageId: input.messageId as any,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    }),
  );
}

export async function stopPersistedAssistantMessage(input: {
  messageId: string;
  userId: string;
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.stopAssistantMessage, {
      messageId: input.messageId as any,
    }),
  );
}

export async function failPersistedAssistantMessage(input: {
  messageId: string;
  userId: string;
  errorCode?: string;
  fallbackText?: string;
}) {
  const convex = await getChatConvexClient(input.userId);
  return toMessage(
    await convex.mutation(api.messages.failAssistantMessage, {
      messageId: input.messageId as any,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      ...(input.fallbackText ? { fallbackText: input.fallbackText } : {}),
    }),
  );
}

export async function deleteMessageForUser(messageId: string, userId: string) {
  const convex = await getChatConvexClient(userId);
  return convex.mutation(api.messages.deleteMessage, {
    messageId: messageId as any,
  });
}

export async function getChatSyncSnapshotForUser(input: {
  userId: string;
  since?: number;
  surface?: ChatSurface;
  includeTemporary?: boolean;
  conversationLimit?: number;
  messageLimit?: number;
}): Promise<ChatSyncSnapshot> {
  const since = Math.max(0, input.since ?? 0);
  const conversations = await listConversationsForUser({
    userId: input.userId,
    ...(input.surface ? { surface: input.surface } : {}),
    includeTemporary: input.includeTemporary ?? true,
    ...(typeof input.conversationLimit === "number"
      ? { limit: input.conversationLimit }
      : {}),
  });

  const changedConversations = conversations.filter(
    (conversation) =>
      conversation.updatedAt > since || conversation.lastMessageAt > since,
  );

  const conversationRecords = await Promise.all(
    changedConversations.map(async (conversation) => {
      const messages = await listMessagesForConversation({
        conversationId: conversation._id,
        userId: input.userId,
        ...(typeof input.messageLimit === "number"
          ? { limit: input.messageLimit }
          : {}),
      });

      return {
        conversation,
        messages: messages.filter(
          (message) => message.updatedAt > since || message.createdAt > since,
        ),
      };
    }),
  );

  const nextCursor = conversationRecords.reduce((latest, record) => {
    const latestMessageTs = record.messages.reduce(
      (messageLatest, message) =>
        Math.max(messageLatest, message.updatedAt, message.createdAt),
      0,
    );

    return Math.max(
      latest,
      record.conversation.updatedAt,
      record.conversation.lastMessageAt,
      latestMessageTs,
    );
  }, since);

  return {
    cursor: nextCursor,
    conversations: conversationRecords,
  };
}
