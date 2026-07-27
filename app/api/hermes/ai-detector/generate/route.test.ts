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

describe("Hermes AI Detector Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and starts AI detection run for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-ai-1", workspaceId: "ws-1", domain: "ai-detector" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/ai-detector/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", text: "Sample AI text content for detection check" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-ai-1");
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", userId: "user-1", domain: "ai-detector" })
    );
  });
});
