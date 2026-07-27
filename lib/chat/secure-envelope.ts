import type { ChatEncryptedEnvelope } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getSubtleCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable");
  }

  return globalThis.crypto.subtle;
}

export async function derivePortableSyncKey(params: {
  passphrase: string;
  userId: string;
  salt?: string;
}) {
  const subtle = getSubtleCrypto();
  const baseKey = await subtle.importKey(
    "raw",
    encoder.encode(params.passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(params.salt ?? `shothik-chat-sync:${params.userId}`),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptChatPayload(params: {
  key: CryptoKey;
  keyId: string;
  payload: unknown;
  aad?: string;
  preview?: string;
}): Promise<ChatEncryptedEnvelope> {
  const subtle = getSubtleCrypto();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      ...(params.aad ? { additionalData: encoder.encode(params.aad) } : {}),
    },
    params.key,
    encoder.encode(JSON.stringify(params.payload)),
  );

  return {
    version: 1,
    algorithm: "AES-GCM",
    keyId: params.keyId,
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    ...(params.aad ? { aad: params.aad } : {}),
    ...(params.preview ? { preview: params.preview } : {}),
  };
}

export async function decryptChatPayload<T>(params: {
  key: CryptoKey;
  envelope: ChatEncryptedEnvelope;
}): Promise<T> {
  const subtle = getSubtleCrypto();
  const plaintext = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(params.envelope.iv),
      ...(params.envelope.aad
        ? { additionalData: encoder.encode(params.envelope.aad) }
        : {}),
    },
    params.key,
    fromBase64(params.envelope.ciphertext),
  );

  return JSON.parse(decoder.decode(plaintext)) as T;
}
