import { afterEach, describe, expect, it } from "vitest";

import {
  mapChatPrivacyModeToModelRouteClass,
  resolveHermesModelRoute,
} from "@/lib/hermes/modules/model-router";

describe("Hermes model router", () => {
  afterEach(() => {
    delete process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.KIMI_API_KEY;
    delete process.env.NINE_ROUTER_BASE_URL;
    delete process.env.NINE_ROUTER_API_KEY;
    delete process.env.NINE_ROUTER_DEFAULT_ENABLED;
  });

  it("defaults chat capability routes to direct Gemini", () => {
    const route = resolveHermesModelRoute({
      capabilityId: "conversation.respond",
      taskType: "conversation",
      domain: "chat",
      latencyTarget: "realtime",
      modelHandle: "gemini-2.5-flash",
    });

    expect(route).toMatchObject({
      backend: "direct_provider",
      provider: "gemini",
      model: "gemini-2.5-flash",
      modelHandle: "gemini/gemini-2.5-flash",
      transport: "gemini_sse",
    });
  });

  it("uses 9router when explicitly requested and configured", () => {
    process.env.NINE_ROUTER_BASE_URL = "http://localhost:20128";
    process.env.NINE_ROUTER_API_KEY = "router-key";

    const route = resolveHermesModelRoute({
      capabilityId: "conversation.respond",
      taskType: "conversation",
      domain: "chat",
      latencyTarget: "interactive",
      modelHandle: "openai/gpt-4o-mini",
      preferBackend: "nine_router",
    });

    expect(route).toMatchObject({
      backend: "nine_router",
      provider: "openai",
      model: "openai/gpt-4o-mini",
      modelHandle: "openai/gpt-4o-mini",
      transport: "openai_sse",
    });
  });

  it("keeps restricted privacy traffic on direct providers", () => {
    process.env.NINE_ROUTER_BASE_URL = "http://localhost:20128";
    process.env.NINE_ROUTER_API_KEY = "router-key";

    const route = resolveHermesModelRoute({
      capabilityId: "reasoning.plan",
      taskType: "planning",
      domain: "chat",
      latencyTarget: "interactive",
      modelHandle: "openai/gpt-4o-mini",
      preferBackend: "nine_router",
      privacyClass: "restricted",
    });

    expect(route.backend).toBe("direct_provider");
  });
});

describe("chat privacy to router mapping", () => {
  it("maps encrypted sync to restricted", () => {
    expect(mapChatPrivacyModeToModelRouteClass("encrypted_sync")).toBe(
      "restricted",
    );
  });
});
