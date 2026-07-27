export interface RateLimitRouteConfig {
  windowMs: number;
  maxRequests: number;
}

export const ROUTE_RATE_LIMITS: Record<string, RateLimitRouteConfig> = {
  "/api/ai-cowriter": { windowMs: 60_000, maxRequests: 10 },
  "/api/stripe": { windowMs: 60_000, maxRequests: 10 },
  "/api/auth": { windowMs: 60_000, maxRequests: 20 },
  "/api/latex": { windowMs: 60_000, maxRequests: 20 },
  "/api/research": { windowMs: 60_000, maxRequests: 30 },
  "/api/sheet": { windowMs: 60_000, maxRequests: 30 },
  "/api/templates": { windowMs: 60_000, maxRequests: 60 },
  "/api/geolocation": { windowMs: 60 * 60_000, maxRequests: 5 },
};

export const DEFAULT_RATE_LIMIT: RateLimitRouteConfig = {
  windowMs: 60_000,
  maxRequests: 30,
};

export const MAX_RATE_LIMIT_STORE_SIZE = 10_000;

export function getRateLimitForPath(path: string): RateLimitRouteConfig {
  for (const [prefix, config] of Object.entries(ROUTE_RATE_LIMITS)) {
    if (path.startsWith(prefix)) return config;
  }
  return DEFAULT_RATE_LIMIT;
}

export function getMaxWindowMs(): number {
  return Math.max(
    ...Object.values(ROUTE_RATE_LIMITS).map((r) => r.windowMs),
    DEFAULT_RATE_LIMIT.windowMs
  );
}
