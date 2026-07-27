import { afterEach, describe, expect, it } from "vitest";

import {
  listChatVendorCandidates,
  resolveChatVendorSelection,
  resolveChatVendorSelectionForRoute,
  verifyChatVendorAdaptation,
} from "@/lib/hermes/modules/chat-orchestrator/vendor-manager";

describe("chat vendor manager", () => {
  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.KIMI_API_KEY;
    delete process.env.CHAT_VENDOR_PRIORITY;
  });

  it("sorts vendors by configured priority", () => {
    process.env.CHAT_VENDOR_PRIORITY = "openai,deepseek,gemini,kimi";

    const candidates = listChatVendorCandidates();

    expect(candidates.map((entry) => entry.vendor)).toEqual([
      "openai",
      "deepseek",
      "gemini",
      "kimi",
    ]);
  });

  it("resolves explicit vendor model handles", () => {
    process.env.OPENAI_API_KEY = "openai-key";

    const selection = resolveChatVendorSelection({
      modelHandle: "openai/gpt-4o-mini",
      requireConfigured: true,
    });

    expect(selection).toMatchObject({
      provider: "openai",
      model: "gpt-4o-mini",
      modelHandle: "openai/gpt-4o-mini",
      transport: "openai_sse",
      apiKey: "openai-key",
    });
  });

  it("adapts model-router routes to vendor selections", () => {
    const selection = resolveChatVendorSelectionForRoute({
      routeId: "route_1",
      capabilityId: "conversation.respond",
      backend: "nine_router",
      provider: "openai",
      model: "openai/gpt-4o-mini",
      modelHandle: "openai/gpt-4o-mini",
      transport: "openai_sse",
      baseUrl: "http://localhost:20128/v1",
      apiKey: "router-key",
      reason: "test",
      fallbackChain: [],
      observabilityLabels: {},
    });

    expect(selection).toMatchObject({
      provider: "openai",
      model: "openai/gpt-4o-mini",
      baseUrl: "http://localhost:20128/v1",
      apiKey: "router-key",
    });
  });

  it("rejects unsupported backend adaptations", () => {
    expect(
      verifyChatVendorAdaptation({
        selection: {
          provider: "gemini",
          model: "gemini-2.5-flash",
          modelHandle: "gemini/gemini-2.5-flash",
          transport: "gemini_sse",
          baseUrl: "https://generativelanguage.googleapis.com",
          priority: 10,
        },
        backend: "nine_router",
        expectedTransport: "openai_sse",
      }),
    ).toBe(false);
  });
});
