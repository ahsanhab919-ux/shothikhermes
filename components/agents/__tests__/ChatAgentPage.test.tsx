import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import ChatAgentPage from "../ChatAgentPage";
import { getLocalDraftConversationId } from "@/lib/chat/local-history";

const mockReplace = vi.fn();
const mockUseAuth = vi.fn();
const mockUseConversationMessages = vi.fn();
const mockUseChatHistory = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/chat/service", () => ({
  useConversationMessages: (...args: unknown[]) => mockUseConversationMessages(...args),
  useChatService: () => ({
    deleteMessage: vi.fn(),
  }),
  chatQueryKeys: {
    all: ["chat"],
    messages: () => ["chat", "messages"],
  },
}));

vi.mock("@/hooks/useChatHistory", () => ({
  useChatHistory: (...args: unknown[]) => mockUseChatHistory(...args),
}));

vi.mock("@/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/chat/Composer", () => ({
  Composer: () => <div>composer</div>,
}));

vi.mock("@/components/chat/Transcript", () => ({
  Transcript: () => <div>transcript</div>,
}));

describe("ChatAgentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: vi.fn(),
    } as unknown as Response);
    window.localStorage.clear();
    mockUseConversationMessages.mockReturnValue({
      data: [],
      error: null,
    });
    mockUseChatHistory.mockReturnValue({
      conversations: [],
      error: null,
      deleteMessage: vi.fn(),
    });
  });

  it("holds chat bootstrap while auth is still hydrating", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(<ChatAgentPage />);

    expect(screen.getByText("Checking your session")).toBeInTheDocument();
    expect(mockUseConversationMessages).toHaveBeenCalledWith(null, 200, false, {
      enabled: false,
    });
    expect(mockUseChatHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "flagship",
        enabled: false,
      }),
    );
  });

  it("redirects unauthenticated users to login before showing chat", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(<ChatAgentPage />);

    expect(screen.getByText("Redirecting to sign in")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/login?redirect=%2Fagents%2Fchat");
    });
  });

  it("restores locally recovered chat when server history is unavailable", () => {
    const draftId = getLocalDraftConversationId("flagship");
    window.localStorage.setItem(
      "shothik:chat-local-history:if-user-1:flagship",
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        activeConversationId: draftId,
        conversations: [
          {
            summary: {
              _id: draftId,
              userId: "if-user-1",
              surface: "flagship",
              title: "Recovered conversation",
              status: "active",
              pinned: false,
              temporary: false,
              lastMessageAt: Date.now(),
              messageCount: 2,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            messages: [
              {
                _id: "msg-1",
                conversationId: draftId,
                userId: "if-user-1",
                role: "user",
                content: "Recovered prompt",
                contentFormat: "plain",
                status: "completed",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
              {
                _id: "msg-2",
                conversationId: draftId,
                userId: "if-user-1",
                role: "assistant",
                content: "Recovered answer",
                contentFormat: "markdown",
                status: "completed",
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ],
          },
        ],
      }),
    );

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { _id: "if-user-1", name: "Recovered User" },
    });
    mockUseConversationMessages.mockReturnValue({
      data: [],
      error: new Error("Chat history unavailable"),
    });
    mockUseChatHistory.mockReturnValue({
      conversations: [],
      error: new Error("Chat history unavailable"),
      deleteMessage: vi.fn(),
    });

    render(<ChatAgentPage />);

    expect(
      screen.getByText("Restored your recent chat from local recovery because server history is unavailable right now."),
    ).toBeInTheDocument();
  });
});
