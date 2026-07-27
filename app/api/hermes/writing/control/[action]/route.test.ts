import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockPauseRun, mockResumeRun, mockReportProgress } = vi.hoisted(() => ({
  mockPauseRun: vi.fn(),
  mockResumeRun: vi.fn(),
  mockReportProgress: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    pauseRun: mockPauseRun,
    resumeRun: mockResumeRun,
    reportProgress: mockReportProgress,
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes Writing Control API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "pause" }) }
    );

    expect(response.status).toBe(401);
  });

  it("pauses writing generation", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "pause" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPauseRun).toHaveBeenCalledWith("r-1");
  });

  it("resumes writing generation", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "resume" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockResumeRun).toHaveBeenCalledWith("r-1");
  });

  it("updates writing content", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1", content: "Updated text" }),
      }),
      { params: Promise.resolve({ action: "update" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockReportProgress).toHaveBeenCalledWith("r-1", expect.any(String), expect.any(Object));
  });

  it("exports writing document", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1", format: "docx" }),
      }),
      { params: Promise.resolve({ action: "export" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.format).toBe("docx");
  });
});
