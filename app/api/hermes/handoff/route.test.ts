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

describe("Hermes Cross-Domain Handoff API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/handoff", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws-1",
          sourceDomain: "research",
          targetDomain: "slides",
          contextSummary: "Findings summary",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("executes cross-domain handoff for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-target-1", workspaceId: "ws-1", domain: "slides" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/handoff", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws-1",
          sourceDomain: "research",
          targetDomain: "slides",
          sourceRunId: "run-source-1",
          contextSummary: "Research report on quantum computing",
          instructions: "Create presentation",
        }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.targetRunId).toBe("run-target-1");
    expect(data.data.sourceDomain).toBe("research");
    expect(data.data.targetDomain).toBe("slides");
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", userId: "user-1", domain: "slides" })
    );
    expect(mockStartRun).toHaveBeenCalledWith("run-target-1");
  });

  it("validates request body", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/handoff", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "", sourceDomain: "invalid" }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreateRun).not.toHaveBeenCalled();
  });
});
