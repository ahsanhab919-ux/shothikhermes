import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "./rateLimiter";
import { logger } from "./logger";
import {
  DEFAULT_RATE_LIMIT,
  type RateLimitRouteConfig,
} from "./rate-limit-config";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://prod-api.shothik.ai";

export interface AuthenticatedUser {
  userId: string;
  email?: string;
  name?: string;
}

export async function verifyAuthToken(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token || token.length < 10) return null;

  try {
    const res = await fetch(`${API_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const user = data?.data || data?.user || data;
    if (!user) return null;

    const userId = user._id || user.id;
    if (!userId) return null;

    return {
      userId,
      email: user.email,
      name: user.name || user.fullName,
    };
  } catch {
    return null;
  }
}

interface ProtectedRouteOptions {
  rateLimitConfig?: RateLimitRouteConfig;
  requireAuth?: boolean;
}

type RouteHandler = (
  request: NextRequest,
  user: AuthenticatedUser | null,
  ...args: any[]
) => Promise<Response | NextResponse>;

function getClientIdentifier(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

export function withApiProtection(
  handler: RouteHandler,
  options: ProtectedRouteOptions = {}
) {
  const { rateLimitConfig = DEFAULT_RATE_LIMIT, requireAuth = true } = options;

  return async (request: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const identifier = getClientIdentifier(request);

    const { allowed, remaining, resetAt } = await checkRateLimit(
      identifier,
      rateLimitConfig
    );

    if (!allowed) {
      logger.warn("Rate limit exceeded", {
        identifier: identifier.substring(0, 20),
        path: request.nextUrl.pathname,
      });
      return rateLimitResponse(remaining, resetAt);
    }

    let user: AuthenticatedUser | null = null;
    if (requireAuth) {
      user = await verifyAuthToken(request);
      if (!user) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    try {
      const response = await handler(request, user, ...args);

      logger.info("API request completed", {
        method: request.method,
        path: request.nextUrl.pathname,
        status: (response as any).status || 200,
        duration: Date.now() - start,
        userId: user?.userId,
      });

      return response;
    } catch (error) {
      logger.error("API request failed", error, {
        method: request.method,
        path: request.nextUrl.pathname,
        userId: user?.userId,
      });

      const message =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
