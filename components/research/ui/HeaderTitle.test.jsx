import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import HeaderTitle from "./HeaderTitle";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

// Mock NextImage
vi.mock("next/image", () => ({
  default: (props) => <img {...props} alt={props.alt} />,
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("HeaderTitle", () => {
  it("renders the download button", () => {
    render(
      <HeaderTitle
        headerHeight={0}
        setHeaderHeight={() => {}}
        query="Test"
        researchItem={{}}
      />,
    );

    // Before changes: the button has an image with alt="Download"
    // The button itself might not have a name, but the image inside has alt text.
    // Screen readers usually pick up the image alt text as the button name if no aria-label is present.
    const button = screen.getByRole("button", { name: /Download/i });
    expect(button).not.toBeNull();
  });
});
