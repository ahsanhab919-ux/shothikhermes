import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Transcript } from "../Transcript";
import type { ChatMessage } from "@/lib/chat/types";

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("../MessageActions", () => ({
  MessageActions: () => <div data-testid="message-actions" />,
}));

vi.mock("../MarkdownMessage", () => ({
  MarkdownMessage: ({ content }: { content: string }) => <div>{content}</div>,
}));

function createMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    _id: "message-1",
    conversationId: "conversation-1",
    userId: "user-1",
    role: "assistant",
    content: "",
    contentFormat: "markdown",
    status: "completed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("Transcript", () => {
  it("renders /spec user turns as a first-class slash command", () => {
    render(
      <Transcript
        messages={[
          createMessage({
            _id: "user-spec",
            role: "user",
            content: "/spec Draft the scalable chat UX",
            contentFormat: "plain",
          }),
        ]}
      />,
    );

    expect(screen.getByText("/spec")).toBeInTheDocument();
    expect(screen.getByText("Draft the scalable chat UX")).toBeInTheDocument();
    expect(screen.queryByText("/spec Draft the scalable chat UX")).not.toBeInTheDocument();
  });

  it("renders assistant progress and inline errors inside the transcript", () => {
    render(
      <Transcript
        messages={[
          createMessage({
            _id: "assistant-error",
            status: "error",
            metadata: {
              statusLabel: "Request failed",
              progress: [
                { id: "queue", label: "Queued", state: "completed" },
                { id: "response", label: "Response", state: "error", detail: "Rate limit exceeded" },
              ],
              inlineError: {
                message: "Rate limit exceeded. Please wait a moment.",
                recoverable: true,
              },
            },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Request failed")).toBeInTheDocument();
    expect(screen.getByText("Queued")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Rate limit exceeded. Please wait a moment.");
  });
});
