import { describe, expect, it } from "vitest";

import { getHermesCapabilityRegistry } from "@/lib/hermes/modules/capability-registry";

describe("Hermes capability registry", () => {
  it("lists enabled chat capabilities", () => {
    const registry = getHermesCapabilityRegistry();

    const capabilities = registry.listCapabilities({ domain: "chat" });

    expect(capabilities.map((capability) => capability.id)).toEqual(
      expect.arrayContaining([
        "conversation.respond",
        "reasoning.plan",
        "retrieval.search",
        "document.ingest",
      ]),
    );
  });

  it("requires known capability definitions", () => {
    const registry = getHermesCapabilityRegistry();

    const capability = registry.requireCapability("conversation.respond");

    expect(capability.ownerModule).toBe("chat-orchestrator");
    expect(capability.executionMode).toBe("model");
  });

  it("exposes model capabilities by id", () => {
    const registry = getHermesCapabilityRegistry();

    const capability = registry.getModelCapability("openai/gpt-4o-mini");

    expect(capability?.supportsStreaming).toBe(true);
    expect(capability?.modelId).toBe("gpt-4o-mini");
  });
});
