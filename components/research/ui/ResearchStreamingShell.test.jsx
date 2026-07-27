import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import ResearchStreamingShell from "./ResearchStreamingShell";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

// Mock NextImage
vi.mock("next/image", () => ({
  default: (props) => <img {...props} alt={props.alt} />,
}));

// Mock child components
vi.mock("./ResearchProcessLogs", () => ({ default: () => <div>Logs</div> }));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const createMockStore = () =>
  configureStore({
    reducer: {
      researchCore: (state = { userPrompt: "Test Prompt" }, action) => state,
    },
  });

describe("ResearchStreamingShell", () => {
  it("renders the disabled download button", () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ResearchStreamingShell />
      </Provider>,
    );

    // It has alt="Download" inside
    const button = screen.getByRole("button", { name: /Download/i });
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(true);
  });
});
