import { describe, expect, it } from "vitest";

import {
  describeRouteAdapterTarget,
  resolveRouteAdapterTarget,
} from "@/lib/hermes/modules/model-router/route-adapter";

describe("route adapter", () => {
  it("maps 9router routes to the gateway service", () => {
    const selection = {
      provider: "openai" as const,
      model: "openai/gpt-4o-mini",
      modelHandle: "openai/gpt-4o-mini",
      transport: "openai_sse" as const,
      apiKey: "router-key",
      baseUrl: "http://localhost:20128/v1",
      priority: 10,
    };

    const described = describeRouteAdapterTarget(
      {
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
      },
      selection,
    );

    expect(described).toMatchObject({
      ruleId: "nine_router_openai_forward",
      targetService: "9router_gateway",
      requestUrl: "http://localhost:20128/v1/chat/completions",
    });
  });

  it("maps Gemini direct routes to the Gemini service", () => {
    const target = resolveRouteAdapterTarget(
      {
        routeId: "route_2",
        capabilityId: "conversation.respond",
        backend: "direct_provider",
        provider: "gemini",
        model: "gemini-2.5-flash",
        modelHandle: "gemini/gemini-2.5-flash",
        transport: "gemini_sse",
        baseUrl: "https://generativelanguage.googleapis.com",
        apiKey: "gem-key",
        reason: "test",
        fallbackChain: [],
        observabilityLabels: {},
      },
      {
        selection: {
          provider: "gemini",
          model: "gemini-2.5-flash",
          modelHandle: "gemini/gemini-2.5-flash",
          transport: "gemini_sse",
          apiKey: "gem-key",
          baseUrl: "https://generativelanguage.googleapis.com",
          priority: 10,
        },
        messages: [{ role: "user", content: "hello" }],
        systemPrompt: "be helpful",
        temperature: 0.8,
        maxOutputTokens: 128,
      },
    );

    expect(target.ruleId).toBe("direct_provider_gemini_stream");
    expect(target.targetService).toBe("google_generative_language");
    expect(target.requestUrl).toContain(
      "/models/gemini-2.5-flash:streamGenerateContent",
    );
  });

  it("throws when no rule matches the route transport", () => {
    expect(() =>
      describeRouteAdapterTarget(
        {
          routeId: "route_3",
          capabilityId: "conversation.respond",
          backend: "nine_router",
          provider: "openai",
          model: "gpt-4o-mini",
          modelHandle: "openai/gpt-4o-mini",
          transport: "gemini_sse",
          baseUrl: "http://localhost:20128/v1",
          apiKey: "router-key",
          reason: "test",
          fallbackChain: [],
          observabilityLabels: {},
        },
        {
          provider: "openai",
          model: "gpt-4o-mini",
          modelHandle: "openai/gpt-4o-mini",
          transport: "gemini_sse",
          apiKey: "router-key",
          baseUrl: "http://localhost:20128/v1",
          priority: 10,
        },
      ),
    ).toThrow(/No route adapter rule matched/);
  });
});
