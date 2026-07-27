import { describe, expect, it } from "vitest";

import { getSlashCommandDisplayText, parseFlagshipSlashCommand } from "../commands";

describe("parseFlagshipSlashCommand", () => {
  it("parses the supported /spec command", () => {
    expect(parseFlagshipSlashCommand("/spec Draft the approved scalable chat UX")).toEqual({
      name: "spec",
      argument: "Draft the approved scalable chat UX",
    });
  });

  it("ignores unsupported commands", () => {
    expect(parseFlagshipSlashCommand("/plan something")).toBeNull();
  });
});

describe("getSlashCommandDisplayText", () => {
  it("returns the command and display body", () => {
    expect(getSlashCommandDisplayText("/spec Build the transcript progress UI")).toEqual({
      command: {
        name: "spec",
        argument: "Build the transcript progress UI",
      },
      body: "Build the transcript progress UI",
    });
  });
});
