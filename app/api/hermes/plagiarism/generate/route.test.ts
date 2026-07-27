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

describe("Hermes Plagiarism Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates and starts plagiarism check run for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-plag-1", workspaceId: "ws-1", domain: "plagiarism" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/plagiarism/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", text: "Sample document content to check for plagiarism" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-plag-1");
  });
});
