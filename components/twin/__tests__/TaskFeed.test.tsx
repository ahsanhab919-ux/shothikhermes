import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TaskFeed from "../TaskFeed";

vi.mock("next/dynamic", () => ({
  default: () => ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("TaskFeed", () => {
  it("calls the Writing Studio continuation handler for completed task results", () => {
    const onContinue = vi.fn();

    render(
      <TaskFeed
        tasks={[
          {
            _id: "task-1",
            title: "Summarize policy memo",
            taskType: "summary",
            status: "completed",
            result: "Draft summary output",
            createdAt: Date.now(),
          },
        ]}
        onContinueInWritingStudio={onContinue}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "twinDashboard.viewResult" }));
    fireEvent.click(screen.getByRole("button", { name: /Continue in Writing Studio/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue.mock.calls[0][0]).toMatchObject({
      _id: "task-1",
      taskType: "summary",
    });
  });
});
