import { describe, expect, it } from "vitest";

import {
  buildChatPrivacyProfile,
  buildConversationPreviewForPrivacy,
  redactChatContentForAudit,
  shouldPersistConversationPreview,
} from "./privacy";

describe("chat privacy helpers", () => {
  it("defaults to standard privacy mode", () => {
    expect(buildChatPrivacyProfile()).toEqual({
      mode: "standard",
      retention: "default",
      containsSensitiveData: false,
    });
  });

  it("minimizes preview persistence for sensitive turns", () => {
    expect(
      shouldPersistConversationPreview({
        mode: "sensitive",
      }),
    ).toBe(false);

    expect(
      buildConversationPreviewForPrivacy("Highly private text", {
        mode: "sensitive",
      }),
    ).toBe("Sensitive conversation");
  });

  it("redacts non-standard privacy content in audit logs", () => {
    expect(
      redactChatContentForAudit("my secret", {
        mode: "encrypted_sync",
      }),
    ).toBe("[redacted:encrypted_sync]");
  });
});
