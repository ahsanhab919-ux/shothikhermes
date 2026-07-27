import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockCreateRun } = vi.hoisted(() => ({
  mockCreateRun: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    createRun: mockCreateRun,
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes runs POST API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/hermes/runs", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws-123",
        domain: "slides",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("HERMES_AUTH_REQUIRED");
  });

  it("creates a new run for an authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-456" } as any);
    mockCreateRun.mockResolvedValue({
      id: "run-789",
      workspaceId: "ws-123",
      userId: "user-456",
      domain: "slides",
      status: "created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const request = new NextRequest("http://localhost/api/hermes/runs", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws-123",
        domain: "slides",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.run.id).toBe("run-789");
    expect(data.data.streamUrl).toBe("/api/hermes/runs/run-789");
    expect(mockCreateRun).toHaveBeenCalledWith({
      sessionId: undefined,
      workspaceId: "ws-123",
      userId: "user-456",
      domain: "slides",
      config: undefined,
      metadata: undefined,
    });
  });

  it("validates the request body", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-456" } as any);

    const request = new NextRequest("http://localhost/api/hermes/runs", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "", // invalid empty string
        domain: "invalid_domain",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(mockCreateRun).not.toHaveBeenCalled();
  });
});
