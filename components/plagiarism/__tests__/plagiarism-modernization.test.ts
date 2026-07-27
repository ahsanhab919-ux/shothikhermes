import { describe, expect, it } from "vitest";

import {
  getOriginalityScore,
  getOriginalityTone,
  normalizePlagiarismInlineError,
} from "../plagiarism-modernization";

describe("plagiarism modernization helpers", () => {
  it("derives originality from the plagiarism score", () => {
    expect(getOriginalityScore({ score: 12 } as any)).toBe(88);
    expect(getOriginalityScore({ score: 0 } as any)).toBe(100);
  });

  it("assigns the correct originality tone", () => {
    expect(getOriginalityTone(95).label).toBe("High originality");
    expect(getOriginalityTone(75).label).toBe("Needs review");
    expect(getOriginalityTone(40).label).toBe("High similarity risk");
  });

  it("returns input-tier errors for empty input", () => {
    const inlineError = normalizePlagiarismInlineError(new Error("Text input is required"), "");

    expect(inlineError.tier).toBe("input");
    expect(inlineError.shortMessage).toBe("Add text to scan");
  });

  it("returns api-tier errors for timeout failures", () => {
    const inlineError = normalizePlagiarismInlineError(
      new Error("The scan took too long and was cancelled."),
      "Valid text for scanning."
    );

    expect(inlineError.tier).toBe("api");
    expect(inlineError.shortMessage).toBe("Scan timed out");
  });

  it("returns system-tier errors for network failures", () => {
    const inlineError = normalizePlagiarismInlineError(
      new Error("Could not connect to the plagiarism server."),
      "Valid text for scanning."
    );

    expect(inlineError.tier).toBe("system");
    expect(inlineError.shortMessage).toBe("Network issue");
  });
});
