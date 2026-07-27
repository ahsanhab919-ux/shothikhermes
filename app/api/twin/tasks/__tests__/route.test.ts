import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateTwinRequest: vi.fn(),
  requireAuth: vi.fn(),
  createTwinClient: vi.fn(),
  checkAbility: vi.fn(),
  logRouteActivity: vi.fn(),
  executeTask: vi.fn(),
  getStyleProfile: vi.fn(),
  query: vi.fn(),
  mutation: vi.fn(),
}));

vi.mock("@/lib/twin-api-auth", () => ({
  authenticateTwinRequest: mocks.authenticateTwinRequest,
  requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/twin-convex", () => ({
  twinApi: {
    twin: {
      getByMaster: "getByMaster",
      getTasksByUser: "getTasksByUser",
      createTask: "createTask",
      createPendingApproval: "createPendingApproval",
      updateTaskStatus: "updateTaskStatus",
    },
  },
  createTwinClient: mocks.createTwinClient,
}));

vi.mock("@/lib/twin-route-guard", () => ({
  checkAbility: mocks.checkAbility,
  logRouteActivity: mocks.logRouteActivity,
}));

vi.mock("@/lib/twin/task-executor", () => ({
  executeTask: mocks.executeTask,
}));

vi.mock("@/lib/twin/get-style-profile", () => ({
  getStyleProfile: mocks.getStyleProfile,
}));

import { POST } from "../route";

describe("POST /api/twin/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireAuth.mockReturnValue(true);
    mocks.checkAbility.mockReturnValue(null);
    mocks.createTwinClient.mockReturnValue({
      query: mocks.query,
      mutation: mocks.mutation,
    });
    mocks.authenticateTwinRequest.mockResolvedValue({
      authenticated: true,
      authType: "jwt",
      token: "jwt-token",
      userId: "user-1",
    });
    mocks.logRouteActivity.mockResolvedValue(undefined);
    mocks.getStyleProfile.mockResolvedValue({ tone: "formal" });
  });

  it("returns 429 when the user's daily task limit is reached", async () => {
    const now = Date.now();

    mocks.query
      .mockResolvedValueOnce({
        _id: "twin-1",
        subscriptionTier: "free",
        approvalRequiredActions: [],
      })
      .mockResolvedValueOnce(Array.from({ length: 5 }, (_, index) => ({
        createdAt: now - index,
      })));

    const response = await POST({
      json: async () => ({
        title: "Investigate sources",
        taskType: "research",
      }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.errorCode).toBe("DAILY_LIMIT_REACHED");
    expect(data.error).toContain("5 tasks/day for free tier");
    expect(mocks.mutation).not.toHaveBeenCalled();
    expect(mocks.executeTask).not.toHaveBeenCalled();
  });

  it("creates a pending approval instead of executing restricted tasks", async () => {
    mocks.query
      .mockResolvedValueOnce({
        _id: "twin-1",
        subscriptionTier: "researcher",
        approvalRequiredActions: ["task:research"],
      })
      .mockResolvedValueOnce([]);

    mocks.mutation
      .mockResolvedValueOnce("task-1")
      .mockResolvedValueOnce(undefined);

    const response = await POST({
      json: async () => ({
        title: "Investigate sources",
        description: "Check recent publications",
        taskType: "research",
      }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      taskId: "task-1",
      status: "pending_approval",
      message: "Task requires approval before execution.",
    });
    expect(mocks.executeTask).not.toHaveBeenCalled();
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      1,
      "createTask",
      expect.objectContaining({
        twinId: "twin-1",
        userId: "user-1",
        title: "Investigate sources",
        taskType: "research",
      }),
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      2,
      "createPendingApproval",
      expect.objectContaining({
        twinId: "twin-1",
        masterId: "user-1",
        action: "task:research",
        payload: expect.objectContaining({
          taskId: "task-1",
          title: "Investigate sources",
          taskType: "research",
        }),
      }),
    );
  });

  it("marks the task as failed when execution throws", async () => {
    mocks.query
      .mockResolvedValueOnce({
        _id: "twin-1",
        name: "Research Twin",
        persona: "helpful",
        expertiseAreas: ["science"],
        communicationStyle: "academic",
        goals: ["accurate summaries"],
        languages: ["en"],
        subscriptionTier: "researcher",
        approvalRequiredActions: [],
      })
      .mockResolvedValueOnce([]);

    mocks.mutation
      .mockResolvedValueOnce("task-2")
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    mocks.executeTask.mockRejectedValue(new Error("Upstream LLM timeout"));

    const response = await POST({
      json: async () => ({
        title: "Draft findings",
        description: "Summarize the source material",
        taskType: "summary",
      }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      taskId: "task-2",
      status: "failed",
      error: "Task execution failed",
    });
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      2,
      "updateTaskStatus",
      {
        taskId: "task-2",
        status: "running",
      },
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      3,
      "updateTaskStatus",
      {
        taskId: "task-2",
        status: "failed",
        result: "Upstream LLM timeout",
      },
    );
  });
});
