import { describe, expect, it } from "vitest";

import {
  decryptChatPayload,
  derivePortableSyncKey,
  encryptChatPayload,
} from "./secure-envelope";

describe("chat secure envelope", () => {
  it("round-trips an encrypted chat payload", async () => {
    const key = await derivePortableSyncKey({
      passphrase: "correct horse battery staple",
      userId: "user-1",
    });

    const envelope = await encryptChatPayload({
      key,
      keyId: "device-key-1",
      aad: "conversation:conv-1",
      payload: {
        message: "hello",
        role: "user",
      },
      preview: "Encrypted message",
    });

    const decrypted = await decryptChatPayload<{
      message: string;
      role: string;
    }>({
      key,
      envelope,
    });

    expect(envelope.algorithm).toBe("AES-GCM");
    expect(decrypted).toEqual({
      message: "hello",
      role: "user",
    });
  });
});
