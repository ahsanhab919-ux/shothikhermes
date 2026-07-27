import { createHash } from "crypto";

import { redisIncr, isRedisAvailable } from "@/lib/infrastructure/redis";
import logger from "@/lib/logger";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function memoryCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of memoryStore) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cutoff = now - config.windowMs;
  memoryCleanup(config.windowMs);

  let entry = memoryStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(identifier, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.timestamps[0] + config.windowMs };
  }
  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const windowSlot = Math.floor(Date.now() / config.windowMs);
  const key = `rl:${identifier}:${windowSlot}`;
  const resetAt = (windowSlot + 1) * config.windowMs;

  const count = await redisIncr(key, windowSeconds);
  return {
    allowed: count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetAt,
  };
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 },
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (isRedisAvailable()) {
    try {
      return await checkRateLimitRedis(identifier, config);
    } catch (err) {
      logger.warn("[rate-limiter] Redis check failed, falling back to memory", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return checkRateLimitMemory(identifier, config);
}

export function rateLimitResponse(remaining: number, resetAt: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Please wait before trying again",
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    },
  );
}

export function getRateLimitKey(req: { headers: { get(name: string): string | null } }, scope: string): string {
  const auth = req.headers.get("authorization");
  if (auth) {
    const hash = createHash("sha256").update(auth).digest("hex").slice(0, 16);
    return `${scope}:auth:${hash}`;
  }
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${scope}:ip:${ip}`;
}

export default checkRateLimit;
