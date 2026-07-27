import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockCreateConversation, mockListConversations } = vi.hoisted(() => ({
  mockCreateConversation: vi.fn(),
  mockListConversations: vi.fn(),
}));

vi.mock("@/lib/chat/server", () => ({
  createPersistedConversation: mockCreateConversation,
  listConversationsForUser: mockListConversations,
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET, POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("chat conversations routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a native InsForge chat session", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/chat/conversations"),
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("INSFORGE_SESSION_REQUIRED");
    expect(mockListConversations).not.toHaveBeenCalled();
  });

  it("lists conversations for the authenticated native chat user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "if-user-1",
      id: "if-user-1",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });
    mockListConversations.mockResolvedValue([{ _id: "conv-1" }]);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/chat/conversations?surface=flagship&limit=10"),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockListConversations).toHaveBeenCalledWith({
      userId: "if-user-1",
      surface: "flagship",
      includeTemporary: false,
      limit: 10,
    });
    expect(data.data).toEqual([{ _id: "conv-1" }]);
  });

  it("creates a conversation for the authenticated native chat user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "if-user-2",
      id: "if-user-2",
      name: "Writer",
      email: "writer@example.com",
      authProvider: "insforge",
    });
    mockCreateConversation.mockResolvedValue({ _id: "conv-2" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/chat/conversations", {
        method: "POST",
        body: JSON.stringify({
          surface: "flagship",
          title: "New chat",
          temporary: false,
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreateConversation).toHaveBeenCalledWith({
      userId: "if-user-2",
      surface: "flagship",
      title: "New chat",
      modelHandle: undefined,
      temporary: false,
      contextRef: undefined,
    });
    expect(data.data).toEqual({ _id: "conv-2" });
  });

  it("returns a structured 503 when chat persistence is unavailable", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "if-user-3",
      id: "if-user-3",
      name: "Writer",
      email: "writer@example.com",
      authProvider: "insforge",
    });
    mockListConversations.mockRejectedValue(
      new Error("You do not have permission to perform this operation (deployment:functions:runInternalQueries)."),
    );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/chat/conversations?surface=flagship"),
    );
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe("CHAT_PERSISTENCE_UNAVAILABLE");
    expect(data.message).toContain("runInternalQueries");
  });
});
