import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/convex/_generated/api";

const {
  mockCreateConvexClientForUser,
  mockQuery,
  mockMutation,
} = vi.hoisted(() => ({
  mockCreateConvexClientForUser: vi.fn(),
  mockQuery: vi.fn(),
  mockMutation: vi.fn(),
}));

vi.mock("@/lib/convex/user-token", () => ({
  createConvexClientForUser: mockCreateConvexClientForUser,
}));

import {
  appendPersistedAssistantChunk,
  appendPersistedUserMessage,
  completePersistedAssistantMessage,
  createPersistedAssistantMessage,
  createPersistedConversation,
  deleteMessageForUser,
  failPersistedAssistantMessage,
  getConversationForUser,
  listConversationsForUser,
  listMessagesForConversation,
  softDeleteConversationForUser,
  stopPersistedAssistantMessage,
  updateConversationForUser,
} from "@/lib/chat/server";

describe("chat server Convex persistence bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateConvexClientForUser.mockResolvedValue({
      query: mockQuery,
      mutation: mockMutation,
    });
  });

  it("lists conversations through authenticated public Convex queries", async () => {
    mockQuery.mockResolvedValue([
      {
        _id: "conv-1",
        userId: "user-1",
        surface: "flagship",
        title: "Chat",
        status: "active",
        pinned: false,
        temporary: false,
        lastMessageAt: 1,
        messageCount: 0,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);

    const data = await listConversationsForUser({
      userId: "user-1",
      surface: "flagship",
      limit: 10,
    });

    expect(mockCreateConvexClientForUser).toHaveBeenCalledWith({ _id: "user-1" });
    expect(mockQuery).toHaveBeenCalledWith(api.conversations.listConversations, {
      surface: "flagship",
      limit: 10,
    });
    expect(data[0].userId).toBe("user-1");
  });

  it("searches conversations when a query string is provided", async () => {
    mockQuery.mockResolvedValue([]);

    await listConversationsForUser({
      userId: "user-1",
      surface: "flagship",
      query: "paper",
      limit: 5,
    });

    expect(mockQuery).toHaveBeenCalledWith(api.conversations.searchConversations, {
      query: "paper",
      surface: "flagship",
      limit: 5,
    });
  });

  it("creates a conversation through the public Convex mutation API", async () => {
    mockMutation.mockResolvedValue({
      _id: "conv-2",
      userId: "user-2",
      surface: "flagship",
      title: "New chat",
      status: "active",
      pinned: false,
      temporary: false,
      lastMessageAt: 1,
      messageCount: 0,
      createdAt: 1,
      updatedAt: 1,
    });

    const data = await createPersistedConversation({
      userId: "user-2",
      surface: "flagship",
      title: "New chat",
    });

    expect(mockMutation).toHaveBeenCalledWith(api.conversations.createConversation, {
      surface: "flagship",
      title: "New chat",
    });
    expect(data._id).toBe("conv-2");
  });

  it("updates conversation title, pin state, and archive state through public mutations", async () => {
    mockMutation.mockResolvedValue({});
    mockQuery.mockResolvedValue({
      _id: "conv-3",
      userId: "user-3",
      surface: "flagship",
      title: "Updated",
      status: "archived",
      pinned: true,
      temporary: false,
      lastMessageAt: 1,
      messageCount: 0,
      createdAt: 1,
      updatedAt: 1,
    });

    const data = await updateConversationForUser({
      userId: "user-3",
      conversationId: "conv-3",
      title: "Updated",
      pinned: true,
      archived: true,
    });

    expect(mockMutation).toHaveBeenNthCalledWith(1, api.conversations.renameConversation, {
      conversationId: "conv-3",
      title: "Updated",
    });
    expect(mockMutation).toHaveBeenNthCalledWith(2, api.conversations.pinConversation, {
      conversationId: "conv-3",
      pinned: true,
    });
    expect(mockMutation).toHaveBeenNthCalledWith(3, api.conversations.archiveConversation, {
      conversationId: "conv-3",
      archived: true,
    });
    expect(mockQuery).toHaveBeenCalledWith(api.conversations.getConversation, {
      conversationId: "conv-3",
    });
    expect(data.status).toBe("archived");
  });

  it("uses user-authenticated public message mutations for chat persistence", async () => {
    mockMutation.mockResolvedValue({
      _id: "msg-1",
      conversationId: "conv-1",
      userId: "user-1",
      role: "assistant",
      content: "hello",
      contentFormat: "markdown",
      status: "completed",
      createdAt: 1,
      updatedAt: 1,
    });

    await appendPersistedUserMessage({
      conversationId: "conv-1",
      userId: "user-1",
      content: "hello",
      metadata: {
        attachments: [{ id: "att-1", kind: "file", name: "paper.pdf" }],
      },
    });
    await createPersistedAssistantMessage({
      conversationId: "conv-1",
      userId: "user-1",
      metadata: {
        sessionId: "session-1",
      },
    });
    await appendPersistedAssistantChunk({
      messageId: "msg-1",
      userId: "user-1",
      delta: " world",
    });
    await completePersistedAssistantMessage({
      messageId: "msg-1",
      userId: "user-1",
      metadata: {
        statusLabel: "done",
      },
    });
    await stopPersistedAssistantMessage({
      messageId: "msg-1",
      userId: "user-1",
    });
    await failPersistedAssistantMessage({
      messageId: "msg-1",
      userId: "user-1",
      errorCode: "oops",
      fallbackText: "retry later",
    });
    await deleteMessageForUser("msg-1", "user-1");

    expect(mockMutation).toHaveBeenCalledWith(api.messages.appendUserMessage, {
      conversationId: "conv-1",
      content: "hello",
      metadata: {
        attachments: [{ id: "att-1", kind: "file", name: "paper.pdf" }],
      },
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.appendAssistantPlaceholder, {
      conversationId: "conv-1",
      metadata: {
        sessionId: "session-1",
      },
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.appendAssistantChunk, {
      messageId: "msg-1",
      delta: " world",
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.completeAssistantMessage, {
      messageId: "msg-1",
      metadata: {
        statusLabel: "done",
      },
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.stopAssistantMessage, {
      messageId: "msg-1",
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.failAssistantMessage, {
      messageId: "msg-1",
      errorCode: "oops",
      fallbackText: "retry later",
    });
    expect(mockMutation).toHaveBeenCalledWith(api.messages.deleteMessage, {
      messageId: "msg-1",
    });
  });

  it("loads a conversation and its messages through public queries", async () => {
    mockQuery
      .mockResolvedValueOnce({
        _id: "conv-9",
        userId: "user-9",
        surface: "flagship",
        title: "Saved",
        status: "active",
        pinned: false,
        temporary: false,
        lastMessageAt: 1,
        messageCount: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .mockResolvedValueOnce([
        {
          _id: "msg-9",
          conversationId: "conv-9",
          userId: "user-9",
          role: "user",
          content: "hello",
          contentFormat: "plain",
          status: "completed",
          createdAt: 1,
          updatedAt: 1,
        },
      ]);
    mockMutation.mockResolvedValue({ success: true });

    const conversation = await getConversationForUser("conv-9", "user-9");
    const messages = await listMessagesForConversation({
      conversationId: "conv-9",
      userId: "user-9",
      limit: 25,
    });
    const deleted = await softDeleteConversationForUser("conv-9", "user-9");

    expect(mockQuery).toHaveBeenNthCalledWith(1, api.conversations.getConversation, {
      conversationId: "conv-9",
    });
    expect(mockQuery).toHaveBeenNthCalledWith(2, api.messages.listMessages, {
      conversationId: "conv-9",
      limit: 25,
    });
    expect(mockMutation).toHaveBeenCalledWith(api.conversations.softDeleteConversation, {
      conversationId: "conv-9",
    });
    expect(conversation._id).toBe("conv-9");
    expect(messages[0]._id).toBe("msg-9");
    expect(deleted).toEqual({ success: true });
  });
});
