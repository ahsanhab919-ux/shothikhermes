import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SendToWritingStudioButton from "../SendToWritingStudioButton";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("SendToWritingStudioButton", () => {
  beforeEach(() => {
    push.mockReset();
    window.sessionStorage.clear();
  });

  it("stores a Writing Studio seed and routes to the requested intent", () => {
    render(
      <SendToWritingStudioButton
        text="This is generated output"
        intent="research"
        title="Summarizer Output"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Send to Writing Studio/i }));

    const seed = JSON.parse(window.sessionStorage.getItem("shothik_writing_studio_seed") || "{}");
    expect(seed).toMatchObject({
      source: "tool",
      title: "Summarizer Output",
      description: "This is generated output",
      intent: "research",
    });
    expect(push).toHaveBeenCalledWith("/writing-studio?intent=research&seed=tool");
  });
});
