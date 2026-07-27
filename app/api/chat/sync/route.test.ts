import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockGetChatSyncSnapshotForUser } = vi.hoisted(() => ({
  mockGetChatSyncSnapshotForUser: vi.fn(),
}));

vi.mock("@/lib/chat/server", () => ({
  getChatSyncSnapshotForUser: mockGetChatSyncSnapshotForUser,
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("chat sync route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated sync requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/chat/sync?since=12"),
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("INSFORGE_SESSION_REQUIRED");
    expect(mockGetChatSyncSnapshotForUser).not.toHaveBeenCalled();
  });

  it("returns a sync snapshot for the authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "if-user-1",
      id: "if-user-1",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });
    mockGetChatSyncSnapshotForUser.mockResolvedValue({
      cursor: 250,
      conversations: [],
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/chat/sync?since=100&surface=flagship&conversationLimit=10&messageLimit=25",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockGetChatSyncSnapshotForUser).toHaveBeenCalledWith({
      userId: "if-user-1",
      since: 100,
      surface: "flagship",
      conversationLimit: 10,
      messageLimit: 25,
    });
    expect(data.data).toEqual({
      cursor: 250,
      conversations: [],
    });
  });

  it("returns a structured failure when sync snapshot generation fails", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "if-user-2",
      id: "if-user-2",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });
    mockGetChatSyncSnapshotForUser.mockRejectedValue(
      new Error("convex snapshot unavailable"),
    );

    const response = await GET(
      new NextRequest("http://localhost:3000/api/chat/sync?since=100"),
    );
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("CHAT_SYNC_FAILED");
    expect(data.message).toContain("convex snapshot unavailable");
  });
});
