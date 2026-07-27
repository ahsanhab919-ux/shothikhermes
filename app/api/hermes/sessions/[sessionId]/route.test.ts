import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const {
  mockGetSessionContext,
  mockResumeSession,
  mockPauseSession,
  mockArchiveSession,
} = vi.hoisted(() => ({
  mockGetSessionContext: vi.fn(),
  mockResumeSession: vi.fn(),
  mockPauseSession: vi.fn(),
  mockArchiveSession: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    getSessionContext: mockGetSessionContext,
    resumeSession: mockResumeSession,
    pauseSession: mockPauseSession,
    archiveSession: mockArchiveSession,
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET, POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes session detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated access", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("HERMES_AUTH_REQUIRED");
  });

  it("returns 404 when the session does not exist", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGetSessionContext.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("SESSION_NOT_FOUND");
  });

  it("returns session context for the owner", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGetSessionContext.mockResolvedValue({
      session: { id: "session-1", userId: "user-1" },
      workspace: { id: "ws-1" },
      runs: [{ id: "run-1" }],
      canResume: true,
    });

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.session).toEqual({ id: "session-1", userId: "user-1" });
    expect(data.data.runs).toEqual([{ id: "run-1" }]);
    expect(data.data.canResume).toBe(true);
  });

  it("rejects access to another user's session", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGetSessionContext.mockResolvedValue({
      session: { id: "session-1", userId: "user-2" },
      workspace: { id: "ws-1" },
      runs: [],
      canResume: false,
    });

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("ACCESS_DENIED");
  });

  it("resumes a session for the owner", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGetSessionContext.mockResolvedValue({
      session: { id: "session-1", userId: "user-1" },
      workspace: { id: "ws-1" },
      runs: [],
      canResume: true,
    });

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "resume" }),
      }),
      { params: Promise.resolve({ sessionId: "session-1" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockResumeSession).toHaveBeenCalledWith("session-1");
    expect(data.success).toBe(true);
  });

  it("validates the session action body", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGetSessionContext.mockResolvedValue({
      session: { id: "session-1", userId: "user-1" },
      workspace: { id: "ws-1" },
      runs: [],
      canResume: true,
    });

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ action: "invalid" }),
      }),
      { params: Promise.resolve({ sessionId: "session-1" }) },
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(mockResumeSession).not.toHaveBeenCalled();
    expect(mockPauseSession).not.toHaveBeenCalled();
    expect(mockArchiveSession).not.toHaveBeenCalled();
  });
});
