/**
 * Server-side Convex client utilities for Next.js API routes.
 *
 * These are used by agent-facing API routes that authenticate via shothik_ API keys
 * rather than Convex JWT sessions. All mutations here are internal (not callable from
 * browser clients) and are called with the CONVEX_DEPLOY_KEY for authorization.
 *
 * Required env vars:
 *   NEXT_PUBLIC_CONVEX_URL  — e.g. https://little-shrimp-242.convex.cloud
 *   CONVEX_DEPLOY_KEY       — Convex deploy key (prod:... or dev:...)
 */

const VALID_INTERNAL_PATHS = new Set([
  "books:createDraftInternal",
  "books:updateDraftInternal",
  "books:generateUploadUrlInternal",
  "books:saveManuscriptFileInternal",
  "books:saveCoverFileInternal",
  "forums:createPostInternal",
  "forums:reactToPostInternal",
  "forums:addChatMessageInternal",
  "conversations:createConversationInternal",
  "conversations:listConversationsInternal",
  "conversations:getConversationInternal",
  "conversations:updateConversationInternal",
  "conversations:softDeleteConversationInternal",
  "conversations:touchConversation",
  "messages:listMessagesInternal",
  "messages:appendUserMessageInternal",
  "messages:appendAssistantPlaceholderInternal",
  "messages:appendAssistantChunkInternal",
  "messages:completeAssistantMessageInternal",
  "messages:stopAssistantMessageInternal",
  "messages:failAssistantMessageInternal",
  "messages:deleteMessageInternal",
]);

async function runInternalMutation(
  functionPath: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (!VALID_INTERNAL_PATHS.has(functionPath)) {
    throw new Error(`Unknown internal mutation path: ${functionPath}`);
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");

  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) throw new Error("CONVEX_DEPLOY_KEY not configured — required for agent mutations");

  const res = await fetch(`${url}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path: functionPath, args }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Convex internal mutation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (data.status === "error") throw new Error(data.errorMessage ?? "Convex mutation error");
  return data.value;
}

async function runInternalQuery(
  functionPath: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (!VALID_INTERNAL_PATHS.has(functionPath)) {
    throw new Error(`Unknown internal query path: ${functionPath}`);
  }

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");

  const deployKey = process.env.CONVEX_DEPLOY_KEY;
  if (!deployKey) throw new Error("CONVEX_DEPLOY_KEY not configured — required for internal queries");

  const res = await fetch(`${url}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Convex ${deployKey}`,
    },
    body: JSON.stringify({ path: functionPath, args }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Convex internal query failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (data.status === "error") throw new Error(data.errorMessage ?? "Convex query error");
  return data.value;
}

export async function createBookDraft(
  title: string,
  userId: string,
  projectId?: string
): Promise<string> {
  return runInternalMutation("books:createDraftInternal", {
    title,
    userId,
    ...(projectId ? { projectId } : {}),
  }) as Promise<string>;
}

export async function updateBookDraft(
  id: string,
  userId: string,
  updates: {
    title?: string;
    subtitle?: string;
    description?: string;
    language?: string;
    category?: string;
    subcategory?: string;
    keywords?: string[];
    listPrice?: string;
    currency?: string;
    manuscriptName?: string;
    manuscriptSize?: number;
    manuscriptFormat?: string;
  }
): Promise<void> {
  await runInternalMutation("books:updateDraftInternal", { id, userId, ...updates });
}

export async function generateUploadUrl(): Promise<string> {
  return runInternalMutation("books:generateUploadUrlInternal", {}) as Promise<string>;
}

export async function saveManuscriptFile(
  bookId: string,
  userId: string,
  storageId: string,
  fileName: string,
  fileSize: number,
  format: string
): Promise<void> {
  await runInternalMutation("books:saveManuscriptFileInternal", {
    bookId,
    userId,
    storageId,
    fileName,
    fileSize,
    format,
  });
}

export async function saveCoverFile(
  bookId: string,
  userId: string,
  storageId: string,
  dimensions: { width: number; height: number }
): Promise<void> {
  await runInternalMutation("books:saveCoverFileInternal", {
    bookId,
    userId,
    storageId,
    dimensions,
  });
}

export async function createForumPost(
  forumId: string,
  authorId: string,
  authorType: "human" | "agent",
  authorName: string,
  content: string
): Promise<string> {
  return runInternalMutation("forums:createPostInternal", {
    forumId,
    authorId,
    authorType,
    authorName,
    content,
  }) as Promise<string>;
}

export async function reactToForumPost(
  postId: string,
  forumId: string,
  reactorId: string,
  reactorType: "human" | "agent",
  reactionType: "intrigued" | "skeptical" | "impressed" | "unsettled"
): Promise<"added" | "removed" | "changed"> {
  return runInternalMutation("forums:reactToPostInternal", {
    postId,
    forumId,
    reactorId,
    reactorType,
    reactionType,
  }) as Promise<"added" | "removed" | "changed">;
}

export async function addForumChatMessage(
  forumId: string,
  authorId: string,
  authorType: "human" | "agent",
  authorName: string,
  message: string,
  replyToId?: string | null
): Promise<string> {
  return runInternalMutation("forums:addChatMessageInternal", {
    forumId,
    authorId,
    authorType,
    authorName,
    message,
    ...(replyToId ? { replyToId } : {}),
  }) as Promise<string>;
}

export async function createConversationInternal(input: {
  userId: string;
  surface: "flagship" | "writing-studio" | "sheet" | "research" | "book-agent";
  title?: string;
  modelHandle?: string;
  temporary?: boolean;
  contextRef?: {
    projectId?: string;
    bookId?: string;
    sheetId?: string;
    researchId?: string;
    localProjectId?: string;
    agentType?: string;
  };
}): Promise<any> {
  return runInternalMutation("conversations:createConversationInternal", input) as Promise<any>;
}

export async function listConversationsInternal(input: {
  userId: string;
  surface?: "flagship" | "writing-studio" | "sheet" | "research" | "book-agent";
  status?: "active" | "archived" | "deleted";
  includeTemporary?: boolean;
  limit?: number;
  query?: string;
}): Promise<any[]> {
  return runInternalQuery("conversations:listConversationsInternal", input) as Promise<any[]>;
}

export async function getConversationInternal(input: {
  userId: string;
  conversationId: string;
}): Promise<any> {
  return runInternalQuery("conversations:getConversationInternal", input) as Promise<any>;
}

export async function updateConversationInternal(input: {
  userId: string;
  conversationId: string;
  title?: string;
  pinned?: boolean;
  archived?: boolean;
}): Promise<any> {
  return runInternalMutation("conversations:updateConversationInternal", input) as Promise<any>;
}

export async function softDeleteConversationInternal(input: {
  userId: string;
  conversationId: string;
}): Promise<{ success: true }> {
  return runInternalMutation("conversations:softDeleteConversationInternal", input) as Promise<{ success: true }>;
}

export async function touchConversationInternal(input: {
  userId: string;
  conversationId: string;
  lastMessagePreview?: string;
  modelHandle?: string;
  messageCountDelta?: number;
}): Promise<any> {
  return runInternalMutation("conversations:touchConversation", input) as Promise<any>;
}

export async function listMessagesInternal(input: {
  conversationId: string;
  userId: string;
  limit?: number;
}): Promise<any[]> {
  return runInternalQuery("messages:listMessagesInternal", input) as Promise<any[]>;
}

export async function appendUserMessageInternal(input: {
  conversationId: string;
  userId: string;
  content: string;
  contentFormat?: "markdown" | "plain";
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    errorCode?: string;
  };
}): Promise<any> {
  return runInternalMutation("messages:appendUserMessageInternal", input) as Promise<any>;
}

export async function appendAssistantPlaceholderInternal(input: {
  conversationId: string;
  userId: string;
  modelHandle?: string;
  parentMessageId?: string;
}): Promise<any> {
  return runInternalMutation("messages:appendAssistantPlaceholderInternal", input) as Promise<any>;
}

export async function appendAssistantChunkInternal(input: {
  messageId: string;
  userId: string;
  delta: string;
}): Promise<any> {
  return runInternalMutation("messages:appendAssistantChunkInternal", input) as Promise<any>;
}

export async function completeAssistantMessageInternal(input: {
  messageId: string;
  userId: string;
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    errorCode?: string;
  };
}): Promise<any> {
  return runInternalMutation("messages:completeAssistantMessageInternal", input) as Promise<any>;
}

export async function stopAssistantMessageInternal(input: {
  messageId: string;
  userId: string;
}): Promise<any> {
  return runInternalMutation("messages:stopAssistantMessageInternal", input) as Promise<any>;
}

export async function failAssistantMessageInternal(input: {
  messageId: string;
  userId: string;
  errorCode?: string;
  fallbackText?: string;
}): Promise<any> {
  return runInternalMutation("messages:failAssistantMessageInternal", input) as Promise<any>;
}

export async function deleteMessageInternal(input: {
  messageId: string;
  userId: string;
}): Promise<{ success: true }> {
  return runInternalMutation("messages:deleteMessageInternal", input) as Promise<{ success: true }>;
}
