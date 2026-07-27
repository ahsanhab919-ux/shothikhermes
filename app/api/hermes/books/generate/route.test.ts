import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockCreateRun, mockStartRun } = vi.hoisted(() => ({
  mockCreateRun: vi.fn(),
  mockStartRun: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    createRun: mockCreateRun,
    startRun: mockStartRun,
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes Books Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/books/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Novel" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates and starts a book run for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-b-1", workspaceId: "ws-1", domain: "books" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/books/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Novel", targetChapterCount: 12 }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-b-1");
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", userId: "user-1", domain: "books" })
    );
    expect(mockStartRun).toHaveBeenCalledWith("run-b-1");
  });
});
