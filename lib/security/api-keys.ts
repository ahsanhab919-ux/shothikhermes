import { z } from "zod";

const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z
    .array(z.enum(["read", "write", "delete", "admin"]))
    .default(["read"]),
  expiresAt: z.date().optional(),
  rateLimit: z.number().default(1000),
  allowedIPs: z.array(z.string()).optional(),
});

export type CreateApiKeyRequest = z.infer<typeof apiKeySchema>;

interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  rateLimit: number;
  allowedIPs?: string[];
  isRevoked: boolean;
}

interface ApiKeyUsage {
  timestamp: number;
  endpoint: string;
  status: number;
  duration: number;
}

const apiKeyStore = new Map<string, ApiKeyRecord>();
const userApiKeys = new Map<string, Set<string>>();
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();
const usageStore = new Map<string, ApiKeyUsage[]>();

const API_KEY_PREFIX = "shothik_";

function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function generateSecret(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function hashKey(key: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(salt + key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

if (!process.env.API_KEY_SALT) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("API_KEY_SALT environment variable must be set in production");
  } else {
    console.warn("[security] API_KEY_SALT is not set — using a temporary random salt. Set this env var before going to production.");
  }
}
const SALT_SEED = process.env.API_KEY_SALT ?? `dev-random-${crypto.randomUUID()}`;

export async function createApiKey(
  userId: string,
  request: CreateApiKeyRequest
): Promise<{ key: string; record: Omit<ApiKeyRecord, "keyHash"> }> {
  apiKeySchema.parse(request);

  const keyId = generateId();
  const keySecret = generateSecret(32);
  const fullKey = `${API_KEY_PREFIX}${keyId}_${keySecret}`;

  const keyHash = await hashKey(fullKey, SALT_SEED);

  const record: ApiKeyRecord = {
    id: keyId,
    userId,
    name: request.name,
    keyHash,
    keyPrefix: fullKey.slice(0, 16),
    permissions: request.permissions,
    createdAt: Date.now(),
    expiresAt: request.expiresAt?.getTime(),
    usageCount: 0,
    rateLimit: request.rateLimit,
    allowedIPs: request.allowedIPs,
    isRevoked: false,
  };

  apiKeyStore.set(keyHash, record);

  if (!userApiKeys.has(userId)) {
    userApiKeys.set(userId, new Set());
  }
  userApiKeys.get(userId)!.add(keyId);

  const { keyHash: _, ...recordWithoutHash } = record;
  return { key: fullKey, record: recordWithoutHash };
}

export async function validateApiKey(
  apiKey: string,
  clientIP?: string
): Promise<ApiKeyRecord | null> {
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = await hashKey(apiKey, SALT_SEED);
  const record = apiKeyStore.get(keyHash);

  if (!record) return null;
  if (record.isRevoked) return null;
  if (record.expiresAt && Date.now() > record.expiresAt) return null;

  if (record.allowedIPs?.length && clientIP) {
    if (!record.allowedIPs.includes(clientIP)) {
      return null;
    }
  }

  return record;
}

export async function checkApiKeyRateLimit(
  keyId: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowStart = Math.floor(Date.now() / 3600000) * 3600000;
  const windowKey = `${keyId}:${windowStart}`;

  const entry = rateLimitStore.get(windowKey);
  const resetAt = windowStart + 3600000;

  if (!entry || entry.windowStart !== windowStart) {
    rateLimitStore.set(windowKey, { count: 1, windowStart });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);

  return {
    allowed: entry.count <= limit,
    remaining,
    resetAt,
  };
}

export async function logApiKeyUsage(
  keyId: string,
  usage: ApiKeyUsage
): Promise<void> {
  const existing = usageStore.get(keyId) || [];
  existing.unshift(usage);
  if (existing.length > 1000) existing.length = 1000;
  usageStore.set(keyId, existing);

  for (const [, record] of apiKeyStore) {
    if (record.id === keyId) {
      record.lastUsedAt = Date.now();
      record.usageCount++;
      break;
    }
  }
}

export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const userKeys = userApiKeys.get(userId);
  if (!userKeys?.has(keyId)) return false;

  for (const [, record] of apiKeyStore) {
    if (record.id === keyId && record.userId === userId) {
      record.isRevoked = true;
      return true;
    }
  }

  return false;
}

export async function listApiKeys(
  userId: string
): Promise<Omit<ApiKeyRecord, "keyHash">[]> {
  const keyIds = userApiKeys.get(userId);
  if (!keyIds) return [];

  const keys: Omit<ApiKeyRecord, "keyHash">[] = [];

  for (const [, record] of apiKeyStore) {
    if (record.userId === userId && keyIds.has(record.id)) {
      const { keyHash, ...withoutHash } = record;
      keys.push(withoutHash);
    }
  }

  return keys;
}

export async function authenticateApiKey(request: Request): Promise<{
  success: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}> {
  const authHeader = request.headers.get("authorization");
  const clientIP =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  const apiKey = authHeader.slice(7);

  const record = await validateApiKey(apiKey, clientIP || undefined);

  if (!record) {
    return {
      success: false,
      error: "Invalid or expired API key",
      status: 401,
    };
  }

  const rateLimit = await checkApiKeyRateLimit(record.id, record.rateLimit);

  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Rate limit exceeded",
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(record.rateLimit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    };
  }

  await logApiKeyUsage(record.id, {
    timestamp: Date.now(),
    endpoint: request.url,
    status: 200,
    duration: 0,
  });

  return {
    success: true,
    userId: record.userId,
    permissions: record.permissions,
    headers: {
      "X-RateLimit-Limit": String(record.rateLimit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
    },
  };
}

export function hasPermission(
  userPermissions: string[],
  required: string
): boolean {
  if (userPermissions.includes("admin")) return true;
  return userPermissions.includes(required);
}
