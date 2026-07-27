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

describe("Hermes Sheets Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/sheets/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Q3 Budget", prompt: "Generate sales report" }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("creates and starts a sheet run for authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockCreateRun.mockResolvedValue({ id: "run-sheet-1", workspaceId: "ws-1", domain: "sheets" });

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/sheets/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws-1", title: "Q3 Budget", prompt: "Generate sales report" }),
      })
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-sheet-1");
    expect(mockCreateRun).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: "ws-1", userId: "user-1", domain: "sheets" })
    );
    expect(mockStartRun).toHaveBeenCalledWith("run-sheet-1");
  });

  it("validates request body parameters", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost/api/hermes/sheets/generate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "", title: "" }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockCreateRun).not.toHaveBeenCalled();
  });
});
