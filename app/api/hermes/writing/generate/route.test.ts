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

describe("Hermes Writing Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/writing/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Article", prompt: "Write tech post" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates and starts a writing run for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-w-1", workspaceId: "ws-1", domain: "writing" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/writing/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Article", prompt: "Write tech post" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-w-1");
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", userId: "user-1", domain: "writing" })
    );
    expect(mockStartRun).toHaveBeenCalledWith("run-w-1");
  });

  it("validates request body parameters", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/writing/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "", title: "" }),
      })
    );

    expect(response.status).toBe(400);
  });
});
