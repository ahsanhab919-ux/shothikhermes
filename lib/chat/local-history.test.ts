import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage } from "./types";
import {
  getLocalDraftConversationId,
  loadLocalChatHistory,
  saveLocalChatHistory,
  upsertLocalConversationSnapshot,
} from "./local-history";

const USER_ID = "insforge-user-1";
const SURFACE = "flagship" as const;

function buildMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const now = Date.now();
  return {
    _id: overrides._id ?? crypto.randomUUID(),
    conversationId: overrides.conversationId ?? "conv-1",
    userId: overrides.userId ?? USER_ID,
    role: overrides.role ?? "user",
    content: overrides.content ?? "Hello from local history",
    contentFormat: overrides.contentFormat ?? "plain",
    status: overrides.status ?? "completed",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata,
    modelHandle: overrides.modelHandle,
    parentMessageId: overrides.parentMessageId,
  };
}

describe("local chat history", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("stores and reloads local snapshots for the active user and surface", () => {
    const draftId = getLocalDraftConversationId(SURFACE);
    const state = upsertLocalConversationSnapshot(loadLocalChatHistory(USER_ID, SURFACE), {
      conversationId: draftId,
      userId: USER_ID,
      surface: SURFACE,
      messages: [
        buildMessage({ conversationId: draftId, content: "First prompt" }),
        buildMessage({
          conversationId: draftId,
          role: "assistant",
          content: "Recovered response",
        }),
      ],
    });

    saveLocalChatHistory(USER_ID, SURFACE, state);
    const loaded = loadLocalChatHistory(USER_ID, SURFACE);

    expect(loaded.activeConversationId).toBe(draftId);
    expect(loaded.conversations).toHaveLength(1);
    expect(loaded.conversations[0].summary.title).toContain("First prompt");
    expect(loaded.conversations[0].messages[1].content).toBe("Recovered response");
  });

  it("keeps the newest snapshot first and updates preview metadata", () => {
    let state = loadLocalChatHistory(USER_ID, SURFACE);
    state = upsertLocalConversationSnapshot(state, {
      conversationId: "conv-old",
      userId: USER_ID,
      surface: SURFACE,
      messages: [buildMessage({ conversationId: "conv-old", content: "Old" })],
    });
    state = upsertLocalConversationSnapshot(state, {
      conversationId: "conv-new",
      userId: USER_ID,
      surface: SURFACE,
      messages: [
        buildMessage({ conversationId: "conv-new", content: "Newest user prompt" }),
        buildMessage({
          conversationId: "conv-new",
          role: "assistant",
          content: "Newest assistant answer",
        }),
      ],
    });

    expect(state.conversations[0].summary._id).toBe("conv-new");
    expect(state.conversations[0].summary.lastMessagePreview).toBe("Newest assistant answer");
    expect(state.conversations[0].summary.messageCount).toBe(2);
  });

  it("returns the same state when the active snapshot is unchanged", () => {
    const draftId = getLocalDraftConversationId(SURFACE);
    const initialMessage = buildMessage({
      conversationId: draftId,
      content: "Stable local snapshot",
      createdAt: 100,
      updatedAt: 100,
    });

    const state = upsertLocalConversationSnapshot(loadLocalChatHistory(USER_ID, SURFACE), {
      conversationId: draftId,
      userId: USER_ID,
      surface: SURFACE,
      messages: [initialMessage],
    });

    const next = upsertLocalConversationSnapshot(state, {
      conversationId: draftId,
      userId: USER_ID,
      surface: SURFACE,
      messages: [initialMessage],
    });

    expect(next).toBe(state);
  });
});
