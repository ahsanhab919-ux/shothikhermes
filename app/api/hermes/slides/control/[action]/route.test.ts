import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const {
  mockPauseSlideGeneration,
  mockResumeSlideGeneration,
  mockUpdateSlideContent,
  mockExportSlideDeck,
} = vi.hoisted(() => ({
  mockPauseSlideGeneration: vi.fn(),
  mockResumeSlideGeneration: vi.fn(),
  mockUpdateSlideContent: vi.fn(),
  mockExportSlideDeck: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    slidesOrchestrator: {
      pauseSlideGeneration: mockPauseSlideGeneration,
      resumeSlideGeneration: mockResumeSlideGeneration,
      updateSlideContent: mockUpdateSlideContent,
      exportSlideDeck: mockExportSlideDeck,
    },
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes Slides Control API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", jobId: "j-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "pause" }) }
    );

    expect(response.status).toBe(401);
  });

  it("pauses slide generation", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockPauseSlideGeneration.mockResolvedValue(undefined);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", jobId: "j-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "pause" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPauseSlideGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "r-1", jobId: "j-1", userId: "user-1" })
    );
  });

  it("resumes slide generation", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockResumeSlideGeneration.mockResolvedValue(undefined);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", jobId: "j-1", workspaceId: "w-1", requestId: "req-1" }),
      }),
      { params: Promise.resolve({ action: "resume" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockResumeSlideGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "r-1", jobId: "j-1", userId: "user-1" })
    );
  });

  it("updates slide content", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockUpdateSlideContent.mockResolvedValue(undefined);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          runId: "r-1",
          jobId: "j-1",
          workspaceId: "w-1",
          requestId: "req-1",
          slideIndex: 0,
          content: { title: "Updated Title", bulletPoints: ["Point 1"] },
        }),
      }),
      { params: Promise.resolve({ action: "update" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdateSlideContent).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "r-1", slideIndex: 0, userId: "user-1" })
    );
  });

  it("exports slide deck", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockExportSlideDeck.mockResolvedValue({ url: "/export/pdf", format: "pdf" });

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          runId: "r-1",
          jobId: "j-1",
          workspaceId: "w-1",
          requestId: "req-1",
          format: "pdf",
        }),
      }),
      { params: Promise.resolve({ action: "export" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual({ url: "/export/pdf", format: "pdf" });
    expect(mockExportSlideDeck).toHaveBeenCalledWith(
      expect.objectContaining({ runId: "r-1", format: "pdf", userId: "user-1" })
    );
  });

  it("returns 400 for invalid action", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1" }),
      }),
      { params: Promise.resolve({ action: "invalid_action" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_ACTION");
  });
});
