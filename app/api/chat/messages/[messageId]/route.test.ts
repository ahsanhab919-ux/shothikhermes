import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockDeleteMessageForUser } = vi.hoisted(() => ({
  mockDeleteMessageForUser: vi.fn(),
}));

vi.mock("@/lib/chat/server", () => ({
  deleteMessageForUser: mockDeleteMessageForUser,
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { DELETE } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("chat message delete route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects delete without native chat auth", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ messageId: "msg-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("INSFORGE_SESSION_REQUIRED");
  });

  it("deletes a message for the authenticated InsForge user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({
      _id: "fbff6e6b-c893-461a-a949-2ca388e7bfae",
      id: "fbff6e6b-c893-461a-a949-2ca388e7bfae",
      name: "Ahsan",
      email: "user@example.com",
      authProvider: "insforge",
    });
    mockDeleteMessageForUser.mockResolvedValue({ success: true });

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ messageId: "msg-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockDeleteMessageForUser).toHaveBeenCalledWith(
      "msg-1",
      "fbff6e6b-c893-461a-a949-2ca388e7bfae",
    );
    expect(data.data).toEqual({ success: true });
  });
});
