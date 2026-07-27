import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/server-auth", () => ({
  getChatAuthenticatedUser: vi.fn(),
}));

const { mockGenerateSlides } = vi.hoisted(() => ({
  mockGenerateSlides: vi.fn(),
}));

vi.mock("@/lib/hermes", () => ({
  getHermesOrchestrator: vi.fn(() => ({
    slidesOrchestrator: {
      generateSlides: mockGenerateSlides,
    },
  })),
}));

import { getChatAuthenticatedUser } from "@/lib/server-auth";
import { POST } from "./route";

const mockGetChatAuthenticatedUser = vi.mocked(getChatAuthenticatedUser);

describe("Hermes Slides Generate API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/hermes/slides/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws-1",
        topic: "AI Fundamentals",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("AUTH_REQUIRED");
  });

  it("starts slide generation for an authenticated user", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);
    mockGenerateSlides.mockResolvedValue("run-slides-1");

    const request = new NextRequest("http://localhost/api/hermes/slides/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws-1",
        topic: "AI Fundamentals",
        slideCount: 8,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.runId).toBe("run-slides-1");
    expect(data.data.streamUrl).toBe("/api/hermes/runs/run-slides-1");
    expect(mockGenerateSlides).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        userId: "user-1",
        topic: "AI Fundamentals",
        slideCount: 8,
      })
    );
  });

  it("validates request body parameters", async () => {
    mockGetChatAuthenticatedUser.mockResolvedValue({ _id: "user-1" } as any);

    const request = new NextRequest("http://localhost/api/hermes/slides/generate", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "", // empty workspace ID invalid
        topic: "", // empty topic invalid
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
    expect(mockGenerateSlides).not.toHaveBeenCalled();
  });
});
