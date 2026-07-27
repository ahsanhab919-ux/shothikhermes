import type { ChatPrivacyMode, ChatPrivacyProfile } from "./types";

export function normalizeChatPrivacyMode(
  value: string | null | undefined,
): ChatPrivacyMode {
  if (value === "sensitive" || value === "encrypted_sync") {
    return value;
  }

  return "standard";
}

export function buildChatPrivacyProfile(input?: Partial<ChatPrivacyProfile>): ChatPrivacyProfile {
  const mode = normalizeChatPrivacyMode(input?.mode);

  return {
    mode,
    retention:
      input?.retention ??
      (mode === "sensitive" ? "minimized" : mode === "encrypted_sync" ? "ephemeral" : "default"),
    containsSensitiveData:
      input?.containsSensitiveData ?? mode !== "standard",
    ...(input?.redactionReason ? { redactionReason: input.redactionReason } : {}),
  };
}

export function shouldPersistConversationPreview(profile?: Partial<ChatPrivacyProfile>) {
  const normalized = buildChatPrivacyProfile(profile);
  return normalized.mode === "standard";
}

export function buildConversationPreviewForPrivacy(
  content: string,
  profile?: Partial<ChatPrivacyProfile>,
) {
  if (!shouldPersistConversationPreview(profile)) {
    return "Sensitive conversation";
  }

  return content.replace(/\s+/g, " ").trim().slice(0, 240) || undefined;
}

export function redactChatContentForAudit(
  content: string,
  profile?: Partial<ChatPrivacyProfile>,
) {
  const normalized = buildChatPrivacyProfile(profile);
  if (normalized.mode === "standard") {
    return content;
  }

  return `[redacted:${normalized.mode}]`;
}
