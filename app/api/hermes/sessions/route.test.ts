import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockCreateSession, mockListSessions } = vi.hoisted(() => ({
  mockCreateSession: vi.fn(),
  mockListSessions: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    createSession: mockCreateSession,
    listSessions: mockListSessions,
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET, POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes sessions collection routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/hermes/sessions"),
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("HERMES_AUTH_REQUIRED");
  });

  it("lists sessions for the authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockListSessions.mockResolvedValue([{ id: "session-1" }]);

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/hermes/sessions?workspaceId=ws-1&status=active&limit=10&offset=5",
      ),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockListSessions).toHaveBeenCalledWith({
      userId: "user-1",
      workspaceId: "ws-1",
      status: "active",
      limit: 10,
      offset: 5,
    });
    expect(data.data.sessions).toEqual([{ id: "session-1" }]);
  });

  it("creates a session for the authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-2" } as any);
    mockCreateSession.mockResolvedValue({ id: "session-2", workspaceId: "ws-2" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/hermes/sessions", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws-2",
          title: "Research session",
          description: "Keep the planning state here",
          settings: { mode: "plan" },
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateSession).toHaveBeenCalledWith({
      workspaceId: "ws-2",
      userId: "user-2",
      title: "Research session",
      description: "Keep the planning state here",
      settings: { mode: "plan" },
      metadata: undefined,
    });
    expect(data.data.session).toEqual({ id: "session-2", workspaceId: "ws-2" });
  });

  it("validates the create request body", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-3" } as any);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/hermes/sessions", {
        method: "POST",
        body: JSON.stringify({
          title: "Missing workspace",
        }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
