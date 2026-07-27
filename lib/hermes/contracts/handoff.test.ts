import { describe, expect, it } from "vitest";
import { CrossDomainHandoffSchema } from "./handoff";

describe("CrossDomainHandoffSchema Contract", () => {
  it("validates a valid cross-domain handoff payload", () => {
    const valid = {
      workspaceId: "ws-100",
      sourceDomain: "research",
      targetDomain: "slides",
      sourceRunId: "run-res-1",
      contextSummary: "Key research findings on AI models",
      artifacts: ["art-1", "art-2"],
      instructions: "Generate 10 slides based on findings",
    };

    const result = CrossDomainHandoffSchema.parse(valid);
    expect(result.sourceDomain).toBe("research");
    expect(result.targetDomain).toBe("slides");
  });

  it("rejects invalid domains", () => {
    const invalid = {
      workspaceId: "ws-100",
      sourceDomain: "unknown-domain",
      targetDomain: "slides",
      contextSummary: "Summary",
    };

    expect(() => CrossDomainHandoffSchema.parse(invalid)).toThrow();
  });
});
