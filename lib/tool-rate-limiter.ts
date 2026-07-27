import { NextResponse } from "next/server";
import { checkRateLimit, type RateLimitConfig } from "@/lib/rateLimiter";

const TIER_RATE_LIMITS: Record<string, number> = {
  free: 10,
  student: 30,
  researcher: 100,
  pro: 500,
};

const RATE_WINDOW_MS = 60 * 60 * 1000;

export interface TieredRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  tier: string;
  response?: NextResponse;
}

export async function checkTieredToolRateLimit(
  userId: string,
  tier: string,
  toolName: string,
): Promise<TieredRateLimitResult> {
  const effectiveTier = tier || "free";
  const limit = TIER_RATE_LIMITS[effectiveTier] ?? TIER_RATE_LIMITS.free;
  const config: RateLimitConfig = { windowMs: RATE_WINDOW_MS, maxRequests: limit };
  const identifier = `tool:${toolName}:${userId}`;

  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      tier: effectiveTier,
      response: NextResponse.json(
        {
          error: `Too many ${toolName} requests this hour`,
          errorCode: "RATE_LIMITED",
          details: `Limit: ${limit}/hour for ${effectiveTier} tier. Try again later or upgrade your plan.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
          },
        },
      ),
    };
  }

  return {
    allowed: true,
    limit,
    remaining: result.remaining,
    tier: effectiveTier,
  };
}
