import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockListMessagesForConversation } = vi.hoisted(() => ({
  mockListMessagesForConversation: vi.fn(),
}));

vi.mock("@/lib/chat/server", () => ({
  listMessagesForConversation: mockListMessagesForConversation,
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("chat conversation messages route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without native chat auth", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/chat/conversations/conv-1/messages"),
      { params: Promise.resolve({ conversationId: "conv-1" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("INSFORGE_SESSION_REQUIRED");
  });

  it("lists messages using the authenticated InsForge user id", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "3a528953-7c13-4f06-b341-5f7dbd0f0956",
      id: "3a528953-7c13-4f06-b341-5f7dbd0f0956",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });
    mockListMessagesForConversation.mockResolvedValue([{ _id: "msg-1" }]);

    const response = await GET(
      new NextRequest("http://localhost/api/chat/conversations/conv-1/messages?limit=50"),
      { params: Promise.resolve({ conversationId: "conv-1" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockListMessagesForConversation).toHaveBeenCalledWith({
      conversationId: "conv-1",
      userId: "3a528953-7c13-4f06-b341-5f7dbd0f0956",
      limit: 50,
    });
    expect(data.data).toEqual([{ _id: "msg-1" }]);
  });
});
