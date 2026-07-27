import { describe, expect, it } from "vitest";

import {
  assessParaphraseQuality,
  findMatchingParaphrasePreset,
} from "../paraphrase-refinement";

describe("paraphrase refinement helpers", () => {
  it("matches presets from existing mode and synonym settings", () => {
    const preset = findMatchingParaphrasePreset("Humanize", "Advanced");

    expect(preset?.id).toBe("expressive");
    expect(preset?.intent).toBe("book");
  });

  it("returns high confidence for clearly varied paraphrase output", () => {
    const result = assessParaphraseQuality(
      "The research paper explains how social media shapes political discourse.",
      "The paper explores the way social platforms influence political conversation."
    );

    expect(result.label).toBe("High confidence");
    expect(result.warnings).toHaveLength(0);
  });

  it("returns warnings when the paraphrased output is nearly unchanged", () => {
    const result = assessParaphraseQuality(
      "This sentence should be paraphrased carefully.",
      "This sentence should be paraphrased carefully."
    );

    expect(result.label).toBe("Low confidence");
    expect(result.warnings[0]).toContain("almost identical");
  });
});
