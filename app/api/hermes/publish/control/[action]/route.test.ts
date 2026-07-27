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

describe("Hermes Publish Control API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports publish bundle", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const response = await POST(
      new NextRequest("http://localhost", {
        method: "POST",
        body: JSON.stringify({ runId: "r-1", workspaceId: "w-1", requestId: "req-1", format: "bundle" }),
      }),
      { params: Promise.resolve({ action: "export" }) }
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.format).toBe("bundle");
  });
});
