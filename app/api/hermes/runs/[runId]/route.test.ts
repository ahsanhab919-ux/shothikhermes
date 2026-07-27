import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const {
  mockGetRunContext,
  mockGetRunHotState,
  mockPauseRun,
  mockResumeRun,
  mockCancelRun,
} = vi.hoisted(() => ({
  mockGetRunContext: vi.fn(),
  mockGetRunHotState: vi.fn(),
  mockPauseRun: vi.fn(),
  mockResumeRun: vi.fn(),
  mockCancelRun: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    getRunContext: mockGetRunContext,
    pauseRun: mockPauseRun,
    resumeRun: mockResumeRun,
    cancelRun: mockCancelRun,
    events: {
      getRunHotState: mockGetRunHotState,
    },
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { GET, POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes run detail and control routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/hermes/runs/[runId]", () => {
    it("rejects unauthenticated requests", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue(null);

      const response = await GET(new NextRequest("http://localhost"), {
        params: Promise.resolve({ runId: "run-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe("HERMES_AUTH_REQUIRED");
    });

    it("returns 404 if the run is not found", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue(null);

      const response = await GET(new NextRequest("http://localhost"), {
        params: Promise.resolve({ runId: "run-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.code).toBe("RUN_NOT_FOUND");
    });

    it("returns 403 when accessing another user's run", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-2" },
        workspace: { id: "ws-1" },
        canResume: false,
      });

      const response = await GET(new NextRequest("http://localhost"), {
        params: Promise.resolve({ runId: "run-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe("ACCESS_DENIED");
    });

    it("returns JSON run context for the run owner", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-1" },
        workspace: { id: "ws-1" },
        canResume: true,
      });
      mockGetRunHotState.mockResolvedValue({ lastEventType: "run_started" });

      const response = await GET(new NextRequest("http://localhost"), {
        params: Promise.resolve({ runId: "run-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.run).toEqual({ id: "run-1", userId: "user-1" });
      expect(data.data.canResume).toBe(true);
      expect(data.data.hotState).toEqual({ lastEventType: "run_started" });
    });
  });

  describe("POST /api/hermes/runs/[runId]", () => {
    it("pauses a run for the owner", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-1" },
        workspace: { id: "ws-1" },
        canResume: true,
      });

      const response = await POST(
        new NextRequest("http://localhost", {
          method: "POST",
          body: JSON.stringify({ action: "pause" }),
        }),
        { params: Promise.resolve({ runId: "run-1" }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPauseRun).toHaveBeenCalledWith("run-1");
      expect(data.success).toBe(true);
    });

    it("resumes a run for the owner", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-1" },
        workspace: { id: "ws-1" },
        canResume: true,
      });

      const response = await POST(
        new NextRequest("http://localhost", {
          method: "POST",
          body: JSON.stringify({ action: "resume" }),
        }),
        { params: Promise.resolve({ runId: "run-1" }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockResumeRun).toHaveBeenCalledWith("run-1");
      expect(data.success).toBe(true);
    });

    it("cancels a run for the owner", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-1" },
        workspace: { id: "ws-1" },
        canResume: true,
      });

      const response = await POST(
        new NextRequest("http://localhost", {
          method: "POST",
          body: JSON.stringify({ action: "cancel" }),
        }),
        { params: Promise.resolve({ runId: "run-1" }) }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockCancelRun).toHaveBeenCalledWith("run-1");
      expect(data.success).toBe(true);
    });

    it("validates the run control action payload", async () => {
      mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
      mockGetRunContext.mockResolvedValue({
        run: { id: "run-1", userId: "user-1" },
        workspace: { id: "ws-1" },
        canResume: true,
      });

      const response = await POST(
        new NextRequest("http://localhost", {
          method: "POST",
          body: JSON.stringify({ action: "invalid_action" }),
        }),
        { params: Promise.resolve({ runId: "run-1" }) }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe("VALIDATION_ERROR");
      expect(mockPauseRun).not.toHaveBeenCalled();
      expect(mockResumeRun).not.toHaveBeenCalled();
      expect(mockCancelRun).not.toHaveBeenCalled();
    });
  });
});
