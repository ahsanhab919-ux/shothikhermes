import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import {
  getRateLimitForPath,
  getMaxWindowMs,
  MAX_RATE_LIMIT_STORE_SIZE,
} from "./lib/rate-limit-config";
import { incrementCounter, setGauge, maybeLogMetrics } from "./lib/runtime-metrics";
import { authenticateApiKey } from "./lib/security/api-keys";
import { owaspMiddleware } from "./lib/security/owasp-compliance";
import { detectSuspiciousActivity, isIPBlocked, logSecurityEvent } from "./lib/security/monitoring";
import { checkDDoSProtection } from "./lib/security/ddos-protection";
import {
  getInsforgePublicConfig,
  hasInsforgePublicConfig,
} from "./lib/insforge/config";
import {
  getAuthenticatedAuthRedirectPath,
  getAuthRateLimitConfig,
} from "./lib/auth-route-guard";

type ProxyUpdateSessionOptions = Parameters<typeof updateSession>[0];

const RATE_LIMIT_STORE = new Map<string, { timestamps: number[] }>();

const JWKS_URL = process.env.NEXT_PUBLIC_CONVEX_URL
  ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/.well-known/jwks.json`
  : null;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
if (JWKS_URL) {
  jwks = createRemoteJWKSet(new URL(JWKS_URL));
}

function getClientId(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((nums[0] << 24) | (nums[1] << 16) | (nums[2] << 8) | nums[3]) >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [base, maskBitsRaw] = cidr.split("/");
  const maskBits = Number(maskBitsRaw);
  if (!base || !Number.isInteger(maskBits) || maskBits < 0 || maskBits > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function isIpAllowlisted(ip: string, allowlist: string): boolean {
  const entries = allowlist
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const entry of entries) {
    if (entry.includes("/")) {
      if (ipInCidr(ip, entry)) return true;
    } else if (entry === ip) {
      return true;
    }
  }
  return false;
}

function checkRateLimit(
  key: string,
  config: { windowMs: number; maxRequests: number }
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = RATE_LIMIT_STORE.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    RATE_LIMIT_STORE.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > now - config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    incrementCounter("ratelimit.rejected");
    return {
      limited: true,
      remaining: 0,
      resetAt: entry.timestamps[0] + config.windowMs,
    };
  }

  entry.timestamps.push(now);
  return {
    limited: false,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

let lastCleanup = Date.now();
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  const maxWindowMs = getMaxWindowMs();

  for (const [key, entry] of RATE_LIMIT_STORE) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - maxWindowMs);
    if (entry.timestamps.length === 0) {
      RATE_LIMIT_STORE.delete(key);
    }
  }

  if (RATE_LIMIT_STORE.size > MAX_RATE_LIMIT_STORE_SIZE) {
    const excess = RATE_LIMIT_STORE.size - MAX_RATE_LIMIT_STORE_SIZE;
    const keys = RATE_LIMIT_STORE.keys();
    for (let i = 0; i < excess; i++) {
      const next = keys.next();
      if (!next.done) RATE_LIMIT_STORE.delete(next.value);
    }
    incrementCounter("ratelimit.store_evictions", excess);
  }

  setGauge("ratelimit.store_size", RATE_LIMIT_STORE.size);
  maybeLogMetrics();
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), payment=(self)",
};

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

async function verifyJWT(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }> {
  if (!jwks) {
    return { valid: false, error: "JWKS not configured" };
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["RS256"],
      issuer: process.env.NEXT_PUBLIC_CONVEX_URL,
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

function extractUserIdFromJwtPayload(payload: Record<string, unknown> | undefined): string | undefined {
  if (!payload) return undefined;
  const sub = payload.sub;
  if (typeof sub === "string" && sub.length > 0) return sub;
  const userId = (payload as Record<string, unknown>).userId;
  if (typeof userId === "string" && userId.length > 0) return userId;
  return undefined;
}

async function tryAppendAuditEvent(event: {
  requestId?: string;
  timestamp: number;
  actorType: "user" | "api_key" | "anonymous" | "system";
  actorId?: string;
  actorRole?: string;
  ip?: string;
  userAgent?: string;
  action: string;
  outcome: "allow" | "deny" | "error";
  method?: string;
  path?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return;
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("./convex/_generated/api");
    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation(api.auditEvents.append, event);
  } catch {
    return;
  }
}

export async function proxy(req: NextRequest) {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;
  const requestId = req.headers.get("x-request-id") ?? (globalThis.crypto?.randomUUID?.() ?? undefined);
  const cookieToken = req.cookies.get("jwt_token")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") && !authHeader.startsWith("Bearer shothik_")
    ? authHeader.slice(7).trim()
    : null;
  const token = cookieToken ?? bearerToken ?? null;
  const clientIP = getClientId(req);
  const isDev = process.env.NODE_ENV === "development";
  const shouldSyncInsforgeSession =
    hasInsforgePublicConfig() &&
    (
      pathname.startsWith("/auth") ||
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/dashboard") ||
      pathname === "/api/chat" ||
      pathname.startsWith("/api/chat/")
    );
  const stagedInsforgeResponse = NextResponse.next({ request: req });

  if (shouldSyncInsforgeSession) {
    try {
      await updateSession({
        requestCookies: req.cookies as unknown as ProxyUpdateSessionOptions["requestCookies"],
        responseCookies: stagedInsforgeResponse.cookies,
        ...getInsforgePublicConfig(),
      });
    } catch (error) {
      console.warn("[proxy] Failed to sync InsForge session", error);
    }
  }

  const insforgeAccessToken = req.cookies.get("insforge_access_token")?.value ?? null;
  const insforgeRefreshToken = req.cookies.get("insforge_refresh_token")?.value ?? null;
  const hasInsforgeSession = Boolean(insforgeAccessToken || insforgeRefreshToken);
  const hasAnyAuthenticatedSession = Boolean(token || hasInsforgeSession);
  const isInsforgeChatApiPath = pathname === "/api/chat" || pathname.startsWith("/api/chat/");

  if (
    pathname === "/api/user-limit" ||
    pathname === "/api/chat" ||
    pathname.startsWith("/api/chat/")
  ) {
    // #region debug-point D:proxy-route-classification
    void fetch("http://127.0.0.1:7777/event", {
      method: "POST",
      body: JSON.stringify({
        sessionId: "chat-auth-session",
        runId: "pre-fix",
        hypothesisId: pathname === "/api/user-limit" ? "D" : "B",
        location: "proxy.ts:route-classification",
        msg: "[DEBUG] Proxy saw chat bootstrap request",
        data: {
          path: pathname,
          method: req.method,
          hasLegacyToken: Boolean(token),
          hasInsforgeAccessToken: Boolean(insforgeAccessToken),
          hasInsforgeRefreshToken: Boolean(insforgeRefreshToken),
          hasInsforgeSession,
          isInsforgeChatApiPath,
        },
        ts: Date.now(),
      }),
    }).catch(() => undefined);
    // #endregion
  }

  const finalizeResponse = (response: NextResponse) => {
    for (const cookie of stagedInsforgeResponse.cookies.getAll()) {
      response.cookies.set(cookie.name, cookie.value, cookie);
    }

    return addSecurityHeaders(response);
  };

  const ipAllowlist = process.env.IP_ALLOWLIST?.trim();
  if (ipAllowlist) {
    const sensitivePrefixes = ["/api/admin", "/api/internal", "/api/writing-studio", "/api/publish"];
    if (sensitivePrefixes.some((p) => pathname.startsWith(p)) && !isIpAllowlisted(clientIP, ipAllowlist)) {
      await logSecurityEvent({
        type: "violation",
        severity: "high",
        source: { ip: clientIP },
        details: {
          path: pathname,
          method: req.method,
          description: "IP not allowlisted",
        },
      });
      await tryAppendAuditEvent({
        requestId,
        timestamp: Date.now(),
        actorType: token ? "user" : "anonymous",
        ip: clientIP,
        userAgent: req.headers.get("user-agent") ?? undefined,
        action: "ip_allowlist.deny",
        outcome: "deny",
        method: req.method,
        path: pathname,
      });
      return finalizeResponse(
        new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
      );
    }
  }

  if (!isDev && pathname.startsWith("/api/")) {
    const ddosCheck = await checkDDoSProtection(req);
    if (!ddosCheck.allowed) {
      await logSecurityEvent({
        type: "violation",
        severity: "high",
        source: { ip: clientIP },
        details: {
          path: pathname,
          method: req.method,
          description: `DDoS protection triggered: ${ddosCheck.reason}`,
        },
      });
      await tryAppendAuditEvent({
        requestId,
        timestamp: Date.now(),
        actorType: hasAnyAuthenticatedSession ? "user" : "anonymous",
        ip: clientIP,
        userAgent: req.headers.get("user-agent") ?? undefined,
        action: "ddos.block",
        outcome: "deny",
        method: req.method,
        path: pathname,
        details: {
          reason: ddosCheck.reason,
          action: ddosCheck.action,
          retryAfter: ddosCheck.retryAfter ?? null,
        },
      });

      const response = new NextResponse(
        JSON.stringify({ 
          error: "Request blocked", 
          reason: ddosCheck.reason,
          retryAfter: ddosCheck.retryAfter 
        }), 
        { 
          status: ddosCheck.action === "challenge" ? 403 : 429,
          headers: {
            "Content-Type": "application/json",
            ...(ddosCheck.retryAfter ? { "Retry-After": String(ddosCheck.retryAfter) } : {})
          }
        }
      );
      return finalizeResponse(response);
    }
  }

  const blockCheck = !isDev ? await isIPBlocked(clientIP) : { blocked: false };
  if (blockCheck.blocked) {
    await logSecurityEvent({
      type: "violation",
      severity: "medium",
      source: { ip: clientIP },
      details: {
        path: pathname,
        method: req.method,
        description: `Blocked IP attempted access: ${blockCheck.reason}`,
      },
    });
    await tryAppendAuditEvent({
      requestId,
      timestamp: Date.now(),
      actorType: token ? "user" : "anonymous",
      ip: clientIP,
      userAgent: req.headers.get("user-agent") ?? undefined,
      action: "ip_block.deny",
      outcome: "deny",
      method: req.method,
      path: pathname,
      details: { reason: blockCheck.reason ?? "blocked" },
    });
    return addSecurityHeaders(
      new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
    );
  }

  if (!isDev) {
    const suspiciousCheck = await detectSuspiciousActivity(req);
    if (suspiciousCheck.action === "block") {
      await logSecurityEvent({
        type: "suspicious",
        severity: "high",
        source: { ip: clientIP },
        details: {
          path: pathname,
          method: req.method,
          description: suspiciousCheck.reasons.join("; "),
        },
      });
      await tryAppendAuditEvent({
        requestId,
        timestamp: Date.now(),
        actorType: hasAnyAuthenticatedSession ? "user" : "anonymous",
        ip: clientIP,
        userAgent: req.headers.get("user-agent") ?? undefined,
        action: "suspicious.block",
        outcome: "deny",
        method: req.method,
        path: pathname,
        details: { reasons: suspiciousCheck.reasons },
      });
      return finalizeResponse(
        new NextResponse(JSON.stringify({ error: "Suspicious activity detected" }), { status: 403 })
      );
    }
  }

  if (pathname.startsWith("/api/")) {
    cleanupStore();

    const owaspResult = await owaspMiddleware(req);
    if (owaspResult) return owaspResult;

    const isStripeWebhook = pathname.startsWith("/api/stripe/") && pathname.endsWith("/webhook");
    const isPublicApi =
      pathname === "/api/health" ||
      pathname === "/api/user-limit" ||
      pathname.startsWith("/api/.well-known") ||
      pathname.startsWith("/api/forum/og/") ||
      pathname === "/api/zoho-webhook" ||
      pathname === "/api/writing-studio/quality-check" ||
      pathname.startsWith("/api/auth/") ||
      isStripeWebhook;

    const authHeader = req.headers.get("authorization");
    let apiKeyUser: { userId: string; permissions: string[] } | null = null;

    if (authHeader?.startsWith("Bearer shothik_agent_") && pathname.startsWith("/api/twin/")) {
      try {
        const rawKey = authHeader.slice(7).trim();
        const encoder = new TextEncoder();
        const data = encoder.encode(rawKey);
        const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
        const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (convexUrl) {
          const { ConvexHttpClient } = await import("convex/browser");
          const convex = new ConvexHttpClient(convexUrl);
          const { api } = await import("./convex/_generated/api");
          const { isBlockedState } = await import("./convex/twin_lifecycle_transitions");
          const twin = await convex.query(api.twin.getByKeyHash, { keyHash }) as Record<string, unknown> | null;
          if (!twin) {
            return finalizeResponse(
              new NextResponse(JSON.stringify({ error: "Invalid Twin API key" }), { status: 401 })
            );
          }
          if (isBlockedState(twin.lifecycleState as string)) {
            return finalizeResponse(
              new NextResponse(JSON.stringify({ error: `Twin is ${twin.lifecycleState} and cannot make requests` }), { status: 403 })
            );
          }
          apiKeyUser = { userId: String(twin._id), permissions: ["twin"] };

          const twinRateLimitKey = `twin:${clientIP}:${String(twin._id)}`;
          const twinRateConfig = getRateLimitForPath(pathname);
          const twinRateResult = checkRateLimit(twinRateLimitKey, twinRateConfig);
          if (twinRateResult.limited) {
            const retryAfter = Math.ceil((twinRateResult.resetAt - Date.now()) / 1000);
            return finalizeResponse(
              new NextResponse(JSON.stringify({ error: "Too many requests", retryAfter }), {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Retry-After": String(retryAfter),
                },
              })
            );
          }

          const lcState = String(twin.lifecycleState);
          const isWriteMethod = req.method !== "GET" && req.method !== "HEAD";
          const accessTier = lcState === "verified" ? "full" : "read_only";

          const PRE_VERIFIED_WRITE_PATHS = [
            "/api/twin/heartbeat",
            "/api/twin/register",
            "/api/twin/claim",
            "/api/twin/verify",
            "/api/twin/request-verification",
          ];
          const isLifecycleAllowed = PRE_VERIFIED_WRITE_PATHS.some((p) => pathname === p);

          if (accessTier === "read_only" && isWriteMethod && !isLifecycleAllowed) {
            return finalizeResponse(
              new NextResponse(
                JSON.stringify({
                  error: `Twin is ${lcState} — only read access and lifecycle actions allowed. Verify to unlock full access.`,
                }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              )
            );
          }

          const allowedSkills = twin.allowedSkills as string[] | undefined;
          const blockedSkills = twin.blockedSkills as string[] | undefined;
          const approvalReq = twin.approvalRequiredActions as string[] | undefined;

          const twinHeaders = new Headers(req.headers);
          twinHeaders.set("X-Twin-Id", String(twin._id));
          twinHeaders.set("X-Twin-MasterId", String(twin.masterId ?? ""));
          twinHeaders.set("X-Twin-LifecycleState", lcState);
          twinHeaders.set("X-Twin-AuthType", "twin_key");
          twinHeaders.set("X-Twin-AccessTier", accessTier);
          if (allowedSkills?.length) twinHeaders.set("X-Twin-AllowedSkills", allowedSkills.join(","));
          if (blockedSkills?.length) twinHeaders.set("X-Twin-BlockedSkills", blockedSkills.join(","));
          if (approvalReq?.length) twinHeaders.set("X-Twin-ApprovalRequired", approvalReq.join(","));

          const twinResponse = NextResponse.next({ request: { headers: twinHeaders } });
          twinResponse.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
          twinResponse.headers.set("X-RateLimit-Remaining", String(twinRateResult.remaining));
          return finalizeResponse(twinResponse);
        } else {
          return finalizeResponse(
            new NextResponse(JSON.stringify({ error: "Twin key validation unavailable" }), { status: 503 })
          );
        }
      } catch (err) {
        console.error("[middleware] Twin key validation error:", err);
        return finalizeResponse(
          new NextResponse(JSON.stringify({ error: "Twin key validation failed" }), { status: 401 })
        );
      }
    } else if (authHeader?.startsWith("Bearer shothik_")) {
      const apiKeyResult = await authenticateApiKey(req);
      if (!apiKeyResult.success) {
        await logSecurityEvent({
          type: "auth_failure",
          severity: "medium",
          source: { ip: clientIP },
          details: {
            path: pathname,
            method: req.method,
            description: apiKeyResult.error || "API key authentication failed",
          },
        });

        const response = new NextResponse(
          JSON.stringify({ error: apiKeyResult.error }),
          { status: apiKeyResult.status || 401 }
        );

        if (apiKeyResult.headers) {
          Object.entries(apiKeyResult.headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
        return finalizeResponse(response);
      }

      apiKeyUser = {
        userId: apiKeyResult.userId!,
        permissions: apiKeyResult.permissions ?? [],
      };
    }

    if (pathname.startsWith("/api/auth/")) {
      const authRateLimitConfig = getAuthRateLimitConfig(isDev);

      if (authRateLimitConfig) {
        const rateLimitKey = `auth:${clientIP}`;
        const { limited, resetAt } = checkRateLimit(rateLimitKey, authRateLimitConfig);

        if (limited) {
          const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
          await logSecurityEvent({
            type: "rate_limit",
            severity: "low",
            source: { ip: clientIP },
            details: {
              path: pathname,
              method: req.method,
              description: "Auth rate limit exceeded",
            },
          });
          return finalizeResponse(
            new NextResponse(
              JSON.stringify({
                error: "Too many authentication attempts",
                message: "Please try again later",
                retryAfter,
              }),
              {
                status: 429,
                headers: {
                  "Content-Type": "application/json",
                  "Retry-After": String(retryAfter),
                },
              }
            )
          );
        }
      }
    }

    const requiresAuth = !isPublicApi;
    const hasValidApiKey = !!apiKeyUser;
    let jwtPayload: Record<string, unknown> | undefined;

    if (
      pathname === "/api/user-limit" ||
      pathname === "/api/chat" ||
      pathname.startsWith("/api/chat/")
    ) {
      // #region debug-point D:proxy-auth-classification
      void fetch("http://127.0.0.1:7777/event", {
        method: "POST",
        body: JSON.stringify({
          sessionId: "chat-auth-session",
          runId: "pre-fix",
          hypothesisId: pathname === "/api/user-limit" ? "D" : "B",
          location: "proxy.ts:auth-classification",
          msg: "[DEBUG] Proxy classified API auth requirements",
          data: {
            path: pathname,
            isPublicApi,
            requiresAuth,
            hasValidApiKey,
            hasAnyAuthenticatedSession,
          },
          ts: Date.now(),
        }),
      }).catch(() => undefined);
      // #endregion
    }

    if (requiresAuth && !hasValidApiKey) {
      if (!token) {
        if (isInsforgeChatApiPath && hasInsforgeSession) {
          // Chat routes are migrating to native InsForge auth; let route-level auth resolve the user.
        } else {
          if (
            pathname === "/api/user-limit" ||
            pathname === "/api/chat" ||
            pathname.startsWith("/api/chat/")
          ) {
            // #region debug-point D:proxy-auth-deny
            void fetch("http://127.0.0.1:7777/event", {
              method: "POST",
              body: JSON.stringify({
                sessionId: "chat-auth-session",
                runId: "pre-fix",
                hypothesisId: pathname === "/api/user-limit" ? "D" : "B",
                location: "proxy.ts:auth-deny",
                msg: "[DEBUG] Proxy denied protected API request before route handler",
                data: {
                  path: pathname,
                  hasInsforgeSession,
                  isInsforgeChatApiPath,
                },
                ts: Date.now(),
              }),
            }).catch(() => undefined);
            // #endregion
          }
          await logSecurityEvent({
            type: "auth_failure",
            severity: "medium",
            source: { ip: clientIP },
            details: {
              path: pathname,
              method: req.method,
              description: "Unauthenticated request to protected API route",
            },
          });
          await tryAppendAuditEvent({
            requestId,
            timestamp: Date.now(),
            actorType: "anonymous",
            ip: clientIP,
            userAgent: req.headers.get("user-agent") ?? undefined,
            action: "auth.required",
            outcome: "deny",
            method: req.method,
            path: pathname,
            details: { reason: "missing_token" },
          });
          return finalizeResponse(
            new NextResponse(JSON.stringify({ error: "Authentication required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }

      if (token) {
        const { valid, payload, error } = await verifyJWT(token);
        jwtPayload = payload;

        if (!valid) {
          await logSecurityEvent({
            type: "auth_failure",
            severity: "medium",
            source: { ip: clientIP },
            details: {
              path: pathname,
              method: req.method,
              description: `JWT verification failed: ${error}`,
            },
          });
          await tryAppendAuditEvent({
            requestId,
            timestamp: Date.now(),
            actorType: "anonymous",
            ip: clientIP,
            userAgent: req.headers.get("user-agent") ?? undefined,
            action: "auth.jwt_invalid",
            outcome: "deny",
            method: req.method,
            path: pathname,
            details: { error: error ?? "unknown" },
          });
          return finalizeResponse(
            new NextResponse(JSON.stringify({ error: "Invalid token" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }
    }

    const routePrefix = "/" + pathname.split("/").slice(1, 3).join("/");
    const rateLimitKey = `${clientIP}:${routePrefix}`;
    const rateConfig = getRateLimitForPath(pathname);

    const { limited, remaining, resetAt } = checkRateLimit(
      rateLimitKey,
      rateConfig
    );

    if (limited) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      await logSecurityEvent({
        type: "rate_limit",
        severity: "low",
        source: { ip: clientIP },
        details: {
          path: pathname,
          method: req.method,
          description: "General rate limit exceeded",
        },
      });
      await tryAppendAuditEvent({
        requestId,
        timestamp: Date.now(),
        actorType: hasValidApiKey ? "api_key" : hasAnyAuthenticatedSession ? "user" : "anonymous",
        actorId: hasValidApiKey ? apiKeyUser!.userId : extractUserIdFromJwtPayload(jwtPayload),
        ip: clientIP,
        userAgent: req.headers.get("user-agent") ?? undefined,
        action: "ratelimit.hit",
        outcome: "deny",
        method: req.method,
        path: pathname,
        details: { retryAfter },
      });
      return finalizeResponse(
        new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Please wait before trying again",
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
            },
          }
        )
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(resetAt / 1000))
    );
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
    const isWriteMethod = req.method !== "GET" && req.method !== "HEAD";
    if (requiresAuth && isWriteMethod) {
      await tryAppendAuditEvent({
        requestId,
        timestamp: Date.now(),
        actorType: hasValidApiKey ? "api_key" : hasAnyAuthenticatedSession ? "user" : "anonymous",
        actorId: hasValidApiKey ? apiKeyUser!.userId : extractUserIdFromJwtPayload(jwtPayload),
        ip: clientIP,
        userAgent: req.headers.get("user-agent") ?? undefined,
        action: "api.write",
        outcome: "allow",
        method: req.method,
        path: pathname,
      });
    }
    return finalizeResponse(response);
  }

  if (pathname.startsWith("/second-me")) {
    const newPath = pathname.replace("/second-me", "/twin");
    return NextResponse.redirect(new URL(newPath, req.url), 301);
  }

  if (pathname.startsWith("/dashboard") && !hasAnyAuthenticatedSession) {
    return finalizeResponse(NextResponse.redirect(new URL("/auth/login", req.url)));
  }

  const authenticatedAuthRedirectPath =
    hasAnyAuthenticatedSession
      ? getAuthenticatedAuthRedirectPath(pathname, req.nextUrl.searchParams)
      : null;
  if (authenticatedAuthRedirectPath) {
    return finalizeResponse(NextResponse.redirect(new URL(authenticatedAuthRedirectPath, req.url)));
  }

  const response = NextResponse.next();
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  return finalizeResponse(response);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
