"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChatMessage,
  ConversationSummary,
  CreateConversationInput,
  ListConversationsInput,
  SearchConversationsInput,
} from "./types";
import { isLocalDraftConversationId } from "./local-history";

async function readJson<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (json as { error?: string } | null)?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return (json as { data: T }).data;
}

function toSearchParams(input: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: (input?: ListConversationsInput) => ["chat", "conversations", input ?? {}] as const,
  conversation: (conversationId?: string | null) => ["chat", "conversation", conversationId ?? null] as const,
  search: (input: SearchConversationsInput | "skip") => ["chat", "search", input] as const,
  messages: (conversationId?: string | null, limit = 200) =>
    ["chat", "messages", conversationId ?? null, limit] as const,
};

export function useConversationHistory(
  input?: ListConversationsInput,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: chatQueryKeys.conversations(input),
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const query = toSearchParams({
        surface: input?.surface,
        status: input?.status,
        includeTemporary: input?.includeTemporary,
        limit: input?.limit,
      });
      return readJson<ConversationSummary[]>(
        await fetch(`/api/chat/conversations${query ? `?${query}` : ""}`, {
          credentials: "same-origin",
        })
      );
    },
  });
  return query;
}

export function useConversationSearch(
  input: SearchConversationsInput | "skip",
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: chatQueryKeys.search(input),
    enabled: (options?.enabled ?? true) && input !== "skip",
    queryFn: async () => {
      if (input === "skip") return [];
      const query = toSearchParams({
        query: input.query,
        surface: input.surface,
        limit: input.limit,
      });
      return readJson<ConversationSummary[]>(
        await fetch(`/api/chat/conversations?${query}`, {
          credentials: "same-origin",
        })
      );
    },
  });
  return query;
}

export function useConversation(conversationId?: string | null) {
  const query = useQuery({
    queryKey: chatQueryKeys.conversation(conversationId),
    enabled: Boolean(conversationId) && !isLocalDraftConversationId(conversationId),
    queryFn: async () =>
      readJson<ConversationSummary>(
        await fetch(`/api/chat/conversations/${conversationId}`, {
          credentials: "same-origin",
        })
      ),
  });
  return query;
}

export function useConversationMessages(
  conversationId?: string | null,
  limit = 200,
  refetchInterval: number | false = false,
  options?: { enabled?: boolean },
) {
  const query = useQuery({
    queryKey: chatQueryKeys.messages(conversationId, limit),
    enabled:
      (options?.enabled ?? true) &&
      Boolean(conversationId) &&
      !isLocalDraftConversationId(conversationId),
    refetchInterval,
    queryFn: async () =>
      readJson<ChatMessage[]>(
        await fetch(`/api/chat/conversations/${conversationId}/messages?limit=${limit}`, {
          credentials: "same-origin",
        })
      ),
  });
  return query;
}

export function useChatService() {
  const queryClient = useQueryClient();

  const createConversation = useMutation({
    mutationFn: async (input: CreateConversationInput) =>
      readJson<ConversationSummary>(
        await fetch("/api/chat/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });

  const updateConversation = useMutation({
    mutationFn: async ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: Record<string, unknown>;
    }) =>
      readJson<ConversationSummary>(
        await fetch(`/api/chat/conversations/${conversationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      ),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: chatQueryKeys.conversation(variables.conversationId),
        }),
      ]);
    },
  });

  const deleteConversation = useMutation({
    mutationFn: async (conversationId: string) =>
      readJson<{ success: true }>(
        await fetch(`/api/chat/conversations/${conversationId}`, {
          method: "DELETE",
        })
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) =>
      readJson<{ success: true }>(
        await fetch(`/api/chat/messages/${messageId}`, {
          method: "DELETE",
        })
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatQueryKeys.all });
    },
  });

  return {
    createConversation: async (input: CreateConversationInput) => createConversation.mutateAsync(input),
    renameConversation: async (conversationId: string, title: string) =>
      updateConversation.mutateAsync({ conversationId, payload: { title } }),
    pinConversation: async (conversationId: string, pinned: boolean) =>
      updateConversation.mutateAsync({ conversationId, payload: { pinned } }),
    archiveConversation: async (conversationId: string, archived: boolean) =>
      updateConversation.mutateAsync({ conversationId, payload: { archived } }),
    deleteConversation: async (conversationId: string) =>
      deleteConversation.mutateAsync(conversationId),
    deleteMessage: async (messageId: string) => deleteMessage.mutateAsync(messageId),
  };
}
