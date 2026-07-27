import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CreateProjectModal from "../CreateProjectModal";

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag) => {
        const Component = ({ children, ...props }) => React.createElement(tag, props, children);
        return Component;
      },
    }
  ),
}));

vi.mock("@/lib/projects-store", () => ({
  getTemplates: (type) => {
    if (type === "research") {
      return [{ id: "journal", name: "Journal Article", description: "Structured journal-ready template.", icon: "FlaskConical" }];
    }
    if (type === "assignment") {
      return [{ id: "essay", name: "Essay", description: "Essay template with guided sections.", icon: "GraduationCap" }];
    }
    return [{ id: "novel", name: "Novel", description: "Novel template.", icon: "BookOpen" }];
  },
}));

describe("CreateProjectModal", () => {
  it("opens directly into the selected research template step when an initial type is provided", () => {
    render(
      <CreateProjectModal
        initialType="research"
        onClose={vi.fn()}
        onProjectCreated={vi.fn()}
        createProject={vi.fn()}
      />
    );

    expect(screen.getByText("Choose a Template")).toBeInTheDocument();
    expect(screen.getByText(/Choose a starting template for your research paper/i)).toBeInTheDocument();
    expect(screen.getByText("Recommended path")).toBeInTheDocument();
    expect(screen.getByText(/Write, cite, and submit your research/i)).toBeInTheDocument();
  });
});
