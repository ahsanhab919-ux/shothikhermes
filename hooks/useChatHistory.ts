"use client";

import { useCallback } from "react";
import { useChatService, useConversationHistory, useConversationSearch } from "@/lib/chat/service";
import type {
  ConversationStatus,
  CreateConversationInput,
  ListConversationsInput,
  SearchConversationsInput,
} from "@/lib/chat/types";

export interface UseChatHistoryOptions {
  surface?: ListConversationsInput["surface"];
  includeArchived?: boolean;
  includeTemporary?: boolean;
  limit?: number;
  searchTerm?: string;
  enabled?: boolean;
}

export function useChatHistory(options: UseChatHistoryOptions = {}) {
  const {
    surface,
    includeArchived = false,
    includeTemporary = false,
    limit,
    searchTerm,
    enabled = true,
  } = options;

  const status: ConversationStatus | undefined = includeArchived ? undefined : "active";
  const conversationsQuery = useConversationHistory({
    ...(surface ? { surface } : {}),
    ...(status ? { status } : {}),
    includeTemporary,
    ...(limit ? { limit } : {}),
  }, { enabled });

  const searchInput: SearchConversationsInput | "skip" =
    searchTerm && searchTerm.trim()
      ? {
          query: searchTerm.trim(),
          ...(surface ? { surface } : {}),
          ...(limit ? { limit } : {}),
        }
      : "skip";

  const searchResultsQuery = useConversationSearch(searchInput, { enabled });
  const {
    createConversation,
    renameConversation,
    deleteConversation,
    pinConversation,
    archiveConversation,
  } = useChatService();

  const create = useCallback(
    (input: CreateConversationInput) => createConversation(input),
    [createConversation]
  );

  const rename = useCallback(
    (conversationId: string, title: string) =>
      renameConversation(conversationId, title),
    [renameConversation]
  );

  const remove = useCallback(
    (conversationId: string) =>
      deleteConversation(conversationId),
    [deleteConversation]
  );

  const pin = useCallback(
    (conversationId: string, pinned: boolean) =>
      pinConversation(conversationId, pinned),
    [pinConversation]
  );

  const archive = useCallback(
    (conversationId: string, archived: boolean) =>
      archiveConversation(conversationId, archived),
    [archiveConversation]
  );

  return {
    conversations: conversationsQuery.data ?? [],
    searchResults: searchResultsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    searchError: searchResultsQuery.error,
    create,
    rename,
    remove,
    pin,
    archive,
  };
}

export default useChatHistory;
