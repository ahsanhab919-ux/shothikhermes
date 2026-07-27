import { Redis } from "@upstash/redis";
import logger from "@/lib/logger";

let redisClient: Redis | null = null;
let redisAvailable = false;

export function getRedis(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!redisAvailable) {
      logger.warn("[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — falling back to in-memory stores. Set these env vars for production.");
    }
    return null;
  }

  try {
    redisClient = new Redis({ url, token });
    redisAvailable = true;
    logger.info("[redis] Connected to Upstash Redis");
    return redisClient;
  } catch (err) {
    logger.error("[redis] Failed to initialize Redis client", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (err) {
    logger.warn("[redis] GET failed", { key, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

export async function redisSet(key: string, value: unknown, exSeconds?: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    if (exSeconds) {
      await redis.set(key, value, { ex: exSeconds });
    } else {
      await redis.set(key, value);
    }
  } catch (err) {
    logger.warn("[redis] SET failed", { key, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function redisSetIfNotExists(
  key: string,
  value: unknown,
  exSeconds?: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const result = exSeconds
      ? await redis.set(key, value, { nx: true, ex: exSeconds })
      : await redis.set(key, value, { nx: true });
    return result === "OK";
  } catch (err) {
    logger.warn("[redis] SET NX failed", { key, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn("[redis] DEL failed", { key, error: err instanceof Error ? err.message : String(err) });
  }
}

export async function redisIncr(key: string, ttlSeconds?: number): Promise<number> {
  const redis = getRedis();
  if (!redis) return 1;
  try {
    const count = await redis.incr(key);
    if (ttlSeconds && count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } catch (err) {
    logger.warn("[redis] INCR failed", { key, error: err instanceof Error ? err.message : String(err) });
    return 1;
  }
}

export function isRedisAvailable(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}
