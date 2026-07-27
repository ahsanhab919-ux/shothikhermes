import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const {
  mockGetConversationForUser,
  mockSoftDeleteConversationForUser,
  mockUpdateConversationForUser,
} = vi.hoisted(() => ({
  mockGetConversationForUser: vi.fn(),
  mockSoftDeleteConversationForUser: vi.fn(),
  mockUpdateConversationForUser: vi.fn(),
}));

vi.mock("@/lib/chat/server", () => ({
  getConversationForUser: mockGetConversationForUser,
  softDeleteConversationForUser: mockSoftDeleteConversationForUser,
  updateConversationForUser: mockUpdateConversationForUser,
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { DELETE, GET, PATCH } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);
const nativeUser = {
  _id: "1f8f6d86-4f6d-4b3c-b3b5-54ff662fbe9c",
  id: "1f8f6d86-4f6d-4b3c-b3b5-54ff662fbe9c",
  name: "Ahsan",
  email: "user@example.com",
  authProvider: "insforge" as const,
};

describe("chat conversation detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ conversationId: "conv-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("INSFORGE_SESSION_REQUIRED");
  });

  it("loads a conversation for the authenticated native user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(nativeUser);
    mockGetConversationForUser.mockResolvedValue({ _id: "conv-1" });

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ conversationId: "conv-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetConversationForUser).toHaveBeenCalledWith(
      "conv-1",
      "1f8f6d86-4f6d-4b3c-b3b5-54ff662fbe9c",
    );
    expect(data.data).toEqual({ _id: "conv-1" });
  });

  it("updates a conversation for the authenticated native user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(nativeUser);
    mockUpdateConversationForUser.mockResolvedValue({ _id: "conv-1", pinned: true });

    const response = await PATCH(
      new NextRequest("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated", pinned: true, archived: false }),
      }),
      { params: Promise.resolve({ conversationId: "conv-1" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockUpdateConversationForUser).toHaveBeenCalledWith({
      conversationId: "conv-1",
      userId: "1f8f6d86-4f6d-4b3c-b3b5-54ff662fbe9c",
      title: "Updated",
      pinned: true,
      archived: false,
    });
    expect(data.data).toEqual({ _id: "conv-1", pinned: true });
  });

  it("soft deletes a conversation for the authenticated native user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(nativeUser);
    mockSoftDeleteConversationForUser.mockResolvedValue({ success: true });

    const response = await DELETE(new NextRequest("http://localhost"), {
      params: Promise.resolve({ conversationId: "conv-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSoftDeleteConversationForUser).toHaveBeenCalledWith(
      "conv-1",
      "1f8f6d86-4f6d-4b3c-b3b5-54ff662fbe9c",
    );
    expect(data.data).toEqual({ success: true });
  });
});
