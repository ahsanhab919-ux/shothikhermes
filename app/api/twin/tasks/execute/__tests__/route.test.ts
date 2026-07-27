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
      getTaskById: "getTaskById",
      getByMaster: "getByMaster",
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

describe("POST /api/twin/tasks/execute", () => {
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

  it("returns 403 when the task is owned by another user", async () => {
    mocks.query.mockResolvedValueOnce({
      _id: "task-1",
      userId: "user-2",
      twinId: "twin-1",
      status: "pending",
      taskType: "research",
      title: "Investigate sources",
    });

    const response = await POST({
      json: async () => ({ taskId: "task-1" }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized: you do not own this task");
    expect(mocks.mutation).not.toHaveBeenCalled();
    expect(mocks.executeTask).not.toHaveBeenCalled();
  });

  it("returns 409 when the task is already completed", async () => {
    mocks.query
      .mockResolvedValueOnce({
        _id: "task-2",
        userId: "user-1",
        twinId: "twin-1",
        status: "completed",
        taskType: "analysis",
        title: "Analyze notes",
      })
      .mockResolvedValueOnce({
        _id: "twin-1",
      });

    const response = await POST({
      json: async () => ({ taskId: "task-2" }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Task is already completed and cannot be re-executed");
    expect(mocks.mutation).not.toHaveBeenCalled();
  });

  it("marks the task as failed when execution errors after being started", async () => {
    mocks.query
      .mockResolvedValueOnce({
        _id: "task-3",
        userId: "user-1",
        twinId: "twin-1",
        status: "pending",
        taskType: "writing",
        title: "Draft chapter",
        description: "Create an outline",
      })
      .mockResolvedValueOnce({
        _id: "twin-1",
        name: "Writer Twin",
        persona: "focused",
        expertiseAreas: ["writing"],
        communicationStyle: "formal",
        goals: ["clarity"],
        languages: ["en"],
      });

    mocks.mutation
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    mocks.executeTask.mockRejectedValue(new Error("Execution pipeline failed"));

    const response = await POST({
      json: async () => ({ taskId: "task-3" }),
    } as any);

    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      taskId: "task-3",
      status: "failed",
      error: "Task execution failed",
    });
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      1,
      "updateTaskStatus",
      {
        taskId: "task-3",
        status: "running",
      },
    );
    expect(mocks.mutation).toHaveBeenNthCalledWith(
      2,
      "updateTaskStatus",
      {
        taskId: "task-3",
        status: "failed",
        result: "Execution pipeline failed",
      },
    );
  });
});
