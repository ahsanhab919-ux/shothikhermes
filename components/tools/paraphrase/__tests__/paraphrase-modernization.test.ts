import { describe, expect, it } from "vitest";

import { buildParaphraseInlineError, getSentenceFragment } from "../paraphrase-modernization";

describe("paraphrase modernization helpers", () => {
  it("extracts a readable sentence fragment for inline error context", () => {
    const fragment = getSentenceFragment(
      "This sentence is too long and should be highlighted first. Another sentence follows."
    );

    expect(fragment).toBe("This sentence is too long and should be highlighted first.");
  });

  it("normalizes limit errors into plain-language inline messages", () => {
    const inlineError = buildParaphraseInlineError(
      { message: "Words limit exceeded" },
      "A very long sentence that needs to be shortened before it can be paraphrased safely."
    );

    expect(inlineError.message).toContain("too long");
    expect(inlineError.fragment).toContain("A very long sentence");
  });
});
