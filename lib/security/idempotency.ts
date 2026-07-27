import { z } from "zod";
import crypto from "crypto";
import { getRedis, redisSetIfNotExists } from "@/lib/infrastructure/redis";

// Idempotency key schema
const idempotencySchema = z.object({
  key: z.string().min(16).max(128),
  userId: z.string(),
  resource: z.string(),
  ttl: z.number().default(86400), // 24 hours default
});

export type IdempotencyRequest = z.infer<typeof idempotencySchema>;

interface IdempotencyRecord {
  status: "pending" | "completed" | "failed";
  response?: unknown;
  createdAt: number;
  expiresAt: number;
}

/**
 * Check if an idempotency key exists and return cached response
 */
export async function checkIdempotency(
  key: string,
  userId: string,
  resource: string
): Promise<IdempotencyRecord | null> {
  const redis = getRedis();
  if (!redis) return null;
  const cacheKey = `idempotency:${userId}:${resource}:${key}`;
  const record = await redis.get<IdempotencyRecord>(cacheKey);
  return record;
}

/**
 * Store idempotency record with response
 */
export async function storeIdempotency(
  key: string,
  userId: string,
  resource: string,
  response: unknown,
  ttl: number = 86400
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const cacheKey = `idempotency:${userId}:${resource}:${key}`;
  const record: IdempotencyRecord = {
    status: "completed",
    response,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl * 1000,
  };
  await redis.setex(cacheKey, ttl, record);
}

/**
 * Mark idempotency key as pending (for long-running operations)
 */
export async function markIdempotencyPending(
  key: string,
  userId: string,
  resource: string,
  ttl: number = 3600
): Promise<boolean> {
  if (!getRedis()) return true;
  const cacheKey = `idempotency:${userId}:${resource}:${key}`;
  
  const record: IdempotencyRecord = {
    status: "pending",
    createdAt: Date.now(),
    expiresAt: Date.now() + ttl * 1000,
  };
  
  return redisSetIfNotExists(cacheKey, record, ttl);
}

/**
 * Generate cryptographically secure idempotency key
 */
export function generateIdempotencyKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Middleware for Express/Next.js API routes
 */
export function withIdempotency(
  handler: (req: any, res: any) => Promise<void>,
  options: {
    resource: string;
    ttl?: number;
  }
) {
  return async (req: any, res: any) => {
    const key = req.headers["idempotency-key"] as string;
    const userId = (req as any).user?.id;
    
    if (!key) {
      // No idempotency key provided - proceed normally
      return handler(req, res);
    }
    
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    
    try {
      // Validate key format
      idempotencySchema.parse({ key, userId, resource: options.resource, ttl: options.ttl });
      
      // Check for existing record
      const existing = await checkIdempotency(key, userId, options.resource);
      
      if (existing) {
        if (existing.status === "completed") {
          // Return cached response
          res.setHeader("Idempotency-Replay", "true");
          res.status(200).json(existing.response);
          return;
        }
        
        if (existing.status === "pending") {
          res.status(409).json({ 
            error: "Request already in progress",
            retryAfter: 5
          });
          return;
        }
      }
      
      // Mark as pending
      await markIdempotencyPending(key, userId, options.resource, options.ttl);
      
      // Override res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        // Store successful response
        storeIdempotency(key, userId, options.resource, body, options.ttl);
        return originalJson(body);
      };
      
      await handler(req, res);
      
    } catch (error) {
      // Store failed state
      await storeIdempotency(key, userId, options.resource, { error: true }, options.ttl);
      throw error;
    }
  };
}

/**
 * Next.js App Router middleware
 */
export async function handleIdempotency(
  request: Request,
  resource: string,
  ttl: number = 86400
): Promise<{ 
  shouldProceed: boolean; 
  cachedResponse?: Response;
  key?: string;
}> {
  const key = request.headers.get("idempotency-key");
  const userId = (request as any).user?.id;
  
  if (!key) {
    return { shouldProceed: true };
  }
  
  if (!userId) {
    return {
      shouldProceed: false,
      cachedResponse: new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      ),
    };
  }
  
  const existing = await checkIdempotency(key, userId, resource);
  
  if (existing?.status === "completed") {
    return {
      shouldProceed: false,
      cachedResponse: new Response(
        JSON.stringify(existing.response),
        { 
          status: 200,
          headers: { "Idempotency-Replay": "true" }
        }
      ),
    };
  }
  
  if (existing?.status === "pending") {
    return {
      shouldProceed: false,
      cachedResponse: new Response(
        JSON.stringify({ error: "Request already in progress" }),
        { status: 409 }
      ),
    };
  }
  
  // Mark as pending
  await markIdempotencyPending(key, userId, resource, ttl);
  
  return { shouldProceed: true, key };
}

/**
 * Store response after successful operation
 */
export async function completeIdempotency(
  key: string | undefined,
  userId: string,
  resource: string,
  response: unknown,
  ttl: number = 86400
): Promise<void> {
  if (!key) return;
  await storeIdempotency(key, userId, resource, response, ttl);
}
