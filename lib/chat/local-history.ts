import type { ChatMessage, ChatSurface, ConversationSummary } from "./types";

const STORAGE_PREFIX = "shothik:chat-local-history";
const STORAGE_VERSION = 1;
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES_PER_CONVERSATION = 200;

export const LOCAL_CHAT_DRAFT_PREFIX = "local-chat:";

export interface LocalConversationSnapshot {
  summary: ConversationSummary;
  messages: ChatMessage[];
}

export interface LocalChatHistoryState {
  version: number;
  updatedAt: number;
  activeConversationId: string | null;
  conversations: LocalConversationSnapshot[];
}

function emptyState(): LocalChatHistoryState {
  return {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    activeConversationId: null,
    conversations: [],
  };
}

function getStorageKey(userId: string, surface: ChatSurface) {
  return `${STORAGE_PREFIX}:${userId}:${surface}`;
}

export function getLocalDraftConversationId(surface: ChatSurface) {
  return `${LOCAL_CHAT_DRAFT_PREFIX}${surface}:draft`;
}

export function isLocalDraftConversationId(conversationId?: string | null) {
  return Boolean(conversationId?.startsWith(LOCAL_CHAT_DRAFT_PREFIX));
}

function clampMessages(messages: ChatMessage[]) {
  return messages
    .slice(-MAX_MESSAGES_PER_CONVERSATION)
    .map((message) => ({
      ...message,
      metadata: message.metadata ? { ...message.metadata } : undefined,
    }));
}

function deriveTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.content.trim());
  if (!firstUserMessage) {
    return "New chat";
  }

  const compact = firstUserMessage.content.replace(/\s+/g, " ").trim();
  return compact.slice(0, 80) || "New chat";
}

function derivePreview(messages: ChatMessage[]) {
  const lastMessage = [...messages]
    .reverse()
    .find((message) => message.content.trim());

  if (!lastMessage) {
    return undefined;
  }

  return lastMessage.content.replace(/\s+/g, " ").trim().slice(0, 240) || undefined;
}

function sanitizeState(state: LocalChatHistoryState): LocalChatHistoryState {
  return {
    version: STORAGE_VERSION,
    updatedAt: state.updatedAt,
    activeConversationId: state.activeConversationId,
    conversations: state.conversations
      .filter((entry) => entry?.summary?._id)
      .slice(0, MAX_CONVERSATIONS)
      .map((entry) => ({
        summary: entry.summary,
        messages: clampMessages(entry.messages ?? []),
      })),
  };
}

export function loadLocalChatHistory(
  userId: string | null | undefined,
  surface: ChatSurface,
): LocalChatHistoryState {
  if (!userId || typeof window === "undefined") {
    return emptyState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId, surface));
    if (!raw) {
      return emptyState();
    }

    const parsed = JSON.parse(raw) as LocalChatHistoryState;
    if (!parsed || parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.conversations)) {
      return emptyState();
    }

    return sanitizeState(parsed);
  } catch {
    return emptyState();
  }
}

export function saveLocalChatHistory(
  userId: string | null | undefined,
  surface: ChatSurface,
  state: LocalChatHistoryState,
) {
  if (!userId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(userId, surface),
    JSON.stringify(sanitizeState(state)),
  );
}

export function upsertLocalConversationSnapshot(
  state: LocalChatHistoryState,
  input: {
    conversationId: string;
    userId: string;
    surface: ChatSurface;
    messages: ChatMessage[];
    summary?: ConversationSummary;
    setActive?: boolean;
  },
): LocalChatHistoryState {
  const normalizedMessages = clampMessages(input.messages);
  if (!normalizedMessages.length) {
    return state;
  }

  const existingIndex = state.conversations.findIndex(
    (entry) => entry.summary._id === input.conversationId,
  );
  const existing = existingIndex >= 0 ? state.conversations[existingIndex] : null;
  const lastMessageAt =
    normalizedMessages[normalizedMessages.length - 1]?.updatedAt ??
    normalizedMessages[normalizedMessages.length - 1]?.createdAt ??
    Date.now();

  const summary: ConversationSummary = input.summary ?? {
    _id: input.conversationId,
    userId: input.userId,
    surface: input.surface,
    title: existing?.summary.title ?? deriveTitle(normalizedMessages),
    status: "active",
    pinned: false,
    temporary: false,
    modelHandle:
      normalizedMessages[normalizedMessages.length - 1]?.modelHandle ??
      existing?.summary.modelHandle,
    contextRef: existing?.summary.contextRef,
    lastMessageAt,
    lastMessagePreview: derivePreview(normalizedMessages),
    messageCount: normalizedMessages.length,
    createdAt: existing?.summary.createdAt ?? normalizedMessages[0]?.createdAt ?? Date.now(),
    updatedAt: lastMessageAt,
  };

  const nextEntry: LocalConversationSnapshot = {
    summary: {
      ...summary,
      lastMessageAt,
      lastMessagePreview: derivePreview(normalizedMessages),
      messageCount: normalizedMessages.length,
      updatedAt: lastMessageAt,
    },
    messages: normalizedMessages,
  };
  const nextActiveConversationId =
    input.setActive === false ? state.activeConversationId : input.conversationId;

  // Keep the write path idempotent so effects that persist local recovery
  // snapshots do not trigger a render loop when nothing materially changed.
  if (
    existingIndex === 0 &&
    nextActiveConversationId === state.activeConversationId &&
    existing &&
    JSON.stringify(existing.summary) === JSON.stringify(nextEntry.summary) &&
    JSON.stringify(existing.messages) === JSON.stringify(nextEntry.messages)
  ) {
    return state;
  }

  const conversations = [...state.conversations];
  if (existingIndex >= 0) {
    conversations.splice(existingIndex, 1);
  }
  conversations.unshift(nextEntry);

  return sanitizeState({
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    activeConversationId: nextActiveConversationId,
    conversations,
  });
}
