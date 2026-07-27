import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "../Composer";

describe("Composer", () => {
  it("renders slash command guidance and inline validation errors", () => {
    render(
      <Composer
        value="/spec"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        commandHint={{
          name: "spec",
          description: "Hermes will handle this turn in spec mode.",
        }}
        errorMessage="`/spec` needs a prompt or an attached document."
      />,
    );

    expect(screen.getByRole("textbox")).toHaveDisplayValue("/spec");
    expect(screen.getByText("/spec", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Hermes will handle this turn in spec mode.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "`/spec` needs a prompt or an attached document.",
    );
  });
});
