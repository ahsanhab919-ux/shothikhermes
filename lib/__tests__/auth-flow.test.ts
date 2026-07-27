import { beforeEach, describe, expect, it } from "vitest";

import {
  clearAuthFlowState,
  getAuthFlowState,
  inferAuthRoutingDecision,
  normalizeAuthIntent,
  saveAuthFlowState,
} from "../auth-flow";

describe("auth-flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("normalizes supported intents and falls back to continue", () => {
    expect(normalizeAuthIntent("research")).toBe("research");
    expect(normalizeAuthIntent("assignment")).toBe("assignment");
    expect(normalizeAuthIntent("unknown")).toBe("continue");
    expect(normalizeAuthIntent(null)).toBe("continue");
  });

  it("persists and clears auth flow state", () => {
    saveAuthFlowState({
      intent: "assignment",
      redirectTo: "/writing-studio?intent=assignment",
      source: "login",
      variant: "contextual",
    });

    expect(getAuthFlowState()).toMatchObject({
      intent: "assignment",
      redirectTo: "/writing-studio?intent=assignment",
      source: "login",
      variant: "contextual",
    });

    clearAuthFlowState();
    expect(getAuthFlowState()).toBeNull();
  });

  it("prefers explicit redirects over inferred routes", () => {
    const decision = inferAuthRoutingDecision({
      explicitRedirect: "/dashboard",
      flowState: {
        intent: "research",
        timestamp: Date.now(),
      },
      recentProjects: [
        { _id: "p1", type: "assignment", lastEditedAt: Date.now() },
      ],
    });

    expect(decision.route).toBe("/dashboard");
    expect(decision.reason).toBe("redirect_override");
  });

  it("uses selected intent to route new users into research mode", () => {
    const decision = inferAuthRoutingDecision({
      flowState: {
        intent: "research",
        timestamp: Date.now(),
      },
      recentProjects: [],
    });

    expect(decision.route).toBe("/writing-studio?intent=research");
    expect(decision.reason).toBe("intent_override");
  });

  it("prefers the most recent matching research project when research intent exists", () => {
    const decision = inferAuthRoutingDecision({
      flowState: {
        intent: "research",
        timestamp: Date.now(),
      },
      recentProjects: [
        { _id: "book-1", type: "book", title: "Memoir", lastEditedAt: 100 },
        { _id: "research-2", type: "research", title: "Polarization Study", lastEditedAt: 90 },
        { _id: "research-3", type: "research", title: "Latest Research", lastEditedAt: 120 },
      ],
    });

    expect(decision.route).toBe("/writing-studio?projectId=research-3");
    expect(decision.reason).toBe("recent_project");
    expect(decision.suggestions[0].title).toContain("Latest Research");
  });

  it("continues the most recent project when no explicit override exists", () => {
    const decision = inferAuthRoutingDecision({
      flowState: {
        intent: "continue",
        timestamp: Date.now(),
      },
      recentProjects: [
        { _id: "older", type: "book", lastEditedAt: 100 },
        { _id: "latest", type: "research", lastEditedAt: 200 },
      ],
    });

    expect(decision.route).toBe("/writing-studio?projectId=latest");
    expect(decision.reason).toBe("recent_project");
  });

  it("builds multiple recent project suggestions for mixed project histories", () => {
    const decision = inferAuthRoutingDecision({
      flowState: {
        intent: "continue",
        timestamp: Date.now(),
      },
      recentProjects: [
        { _id: "assignment-1", type: "assignment", title: "Marketing Case Study", lastEditedAt: 300 },
        { _id: "research-1", type: "research", title: "Literature Review", lastEditedAt: 200 },
        { _id: "book-1", type: "book", title: "Memoir Draft", lastEditedAt: 100 },
      ],
    });

    expect(decision.suggestions.slice(0, 3).map((item) => item.title)).toEqual([
      "Continue Marketing Case Study",
      "Continue Literature Review",
      "Continue Memoir Draft",
    ]);
  });

  it("falls back to account metadata when intent and history are absent", () => {
    const decision = inferAuthRoutingDecision({
      user: {
        accountType: "researcher",
      },
      recentProjects: [],
    });

    expect(decision.route).toBe("/writing-studio?intent=research");
    expect(decision.reason).toBe("account_type");
  });
});
