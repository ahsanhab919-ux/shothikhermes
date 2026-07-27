export type ChatSurface =
  | "flagship"
  | "writing-studio"
  | "sheet"
  | "research"
  | "book-agent";

export type ConversationStatus = "active" | "archived" | "deleted";
export type MessageRole = "system" | "user" | "assistant" | "tool";
export type MessageStatus = "streaming" | "completed" | "stopped" | "error";
export type MessageContentFormat = "markdown" | "plain";
export type ChatTurnProgressState = "pending" | "active" | "completed" | "error";
export type ChatPrivacyMode = "standard" | "sensitive" | "encrypted_sync";
export type ChatRetentionPolicy = "default" | "minimized" | "ephemeral";

export interface ChatSlashCommand {
  name: "spec";
  argument?: string;
}

export interface ChatTurnProgressItem {
  id: string;
  label: string;
  state: ChatTurnProgressState;
  detail?: string;
  updatedAt?: number;
}

export interface ChatInlineError {
  message: string;
  code?: string;
  recoverable?: boolean;
  updatedAt?: number;
}

export interface ChatPrivacyProfile {
  mode: ChatPrivacyMode;
  retention?: ChatRetentionPolicy;
  containsSensitiveData?: boolean;
  redactionReason?: string;
}

export interface ChatEncryptedEnvelope {
  version: 1;
  algorithm: "AES-GCM";
  keyId: string;
  iv: string;
  ciphertext: string;
  aad?: string;
  preview?: string;
}

export interface ChatSyncDescriptor {
  deviceId: string;
  platform?: string;
  sequence?: number;
  clientTimestamp?: number;
  serverCursor?: number;
}

export interface ChatAttachment {
  id: string;
  kind: "file" | "url";
  name: string;
  mimeType?: string;
  preview?: string;
  sourceUrl?: string;
}

export interface ConversationContextRef {
  projectId?: string;
  bookId?: string;
  sheetId?: string;
  researchId?: string;
  localProjectId?: string;
  agentType?: string;
}

export interface ConversationSummary {
  _id: string;
  userId: string;
  surface: ChatSurface;
  title: string;
  status: ConversationStatus;
  pinned: boolean;
  temporary: boolean;
  modelHandle?: string;
  contextRef?: ConversationContextRef;
  lastMessageAt: number;
  lastMessagePreview?: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  contentFormat: MessageContentFormat;
  status: MessageStatus;
  modelHandle?: string;
  parentMessageId?: string;
  metadata?: {
    tokensUsed?: number;
    latencyMs?: number;
    errorCode?: string;
    citations?: unknown;
    sheetMetadata?: unknown;
    researchMetadata?: unknown;
    attachments?: ChatAttachment[];
    runId?: string;
    sessionId?: string;
    workspaceId?: string;
    artifactId?: string;
    statusLabel?: string;
    slashCommand?: ChatSlashCommand;
    progress?: ChatTurnProgressItem[];
    inlineError?: ChatInlineError;
    privacy?: ChatPrivacyProfile;
    sync?: ChatSyncDescriptor;
    modelRoute?: unknown;
    clientEncrypted?: ChatEncryptedEnvelope;
  };

  createdAt: number;
  updatedAt: number;
}

export interface ChatConversationSyncRecord {
  conversation: ConversationSummary;
  messages: ChatMessage[];
}

export interface ChatSyncSnapshot {
  cursor: number;
  conversations: ChatConversationSyncRecord[];
}

export interface ListConversationsInput {
  surface?: ChatSurface;
  status?: ConversationStatus;
  includeTemporary?: boolean;
  limit?: number;
}

export interface SearchConversationsInput {
  query: string;
  surface?: ChatSurface;
  limit?: number;
}

export interface CreateConversationInput {
  surface: ChatSurface;
  title?: string;
  modelHandle?: string;
  temporary?: boolean;
  contextRef?: ConversationContextRef;
}

export interface SendMessageInput {
  conversationId?: string;
  surface: ChatSurface;
  content: string;
  modelHandle?: string;
  contextRef?: ConversationContextRef;
  temporary?: boolean;
}
