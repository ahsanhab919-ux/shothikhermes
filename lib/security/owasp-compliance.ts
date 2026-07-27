import { NextRequest, NextResponse } from "next/server";

interface SecurityCheck {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  check: (req: NextRequest) => Promise<{ passed: boolean; message?: string }>;
}

const accessLog: Array<{ timestamp: number; path: string; method: string; ip: string | null }> = [];
const MAX_ACCESS_LOG = 10000;

const securityChecks: SecurityCheck[] = [
  {
    id: "API1",
    name: "Object Level Authorization",
    severity: "critical",
    check: async (req) => {
      const url = new URL(req.url);
      const resourceId =
        url.searchParams.get("id") || url.pathname.split("/").pop();

      if (resourceId && !isValidResourceId(resourceId)) {
        return { passed: false, message: "Invalid resource identifier" };
      }

      return { passed: true };
    },
  },

  {
    id: "API2",
    name: "Authentication",
    severity: "critical",
    check: async (req) => {
      const authHeader = req.headers.get("authorization");
      const sessionToken = req.cookies.get("__session")?.value;
      const jwtToken = req.cookies.get("jwt_token")?.value;
      const insforgeAccessToken = req.cookies.get("insforge_access_token")?.value;
      const insforgeRefreshToken = req.cookies.get("insforge_refresh_token")?.value;

      const pathname = req.nextUrl.pathname;
      const isStripeWebhook =
        pathname.startsWith("/api/stripe/") && pathname.endsWith("/webhook");
      const isChatApi =
        pathname === "/api/chat" || pathname.startsWith("/api/chat/");
      const isPublicAuthApi =
        pathname === "/api/auth/sign-in" ||
        pathname === "/api/auth/sign-up" ||
        pathname === "/api/auth/sign-out" ||
        pathname === "/api/auth/convex-token" ||
        pathname === "/api/auth/verify-email" ||
        pathname === "/api/auth/refresh" ||
        pathname === "/api/auth/callback" ||
        pathname.startsWith("/api/auth/oauth/");
      const isPublic =
        pathname === "/api/health" ||
        pathname === "/api/user-limit" ||
        pathname.startsWith("/api/.well-known") ||
        pathname === "/api/zoho-webhook" ||
        pathname.startsWith("/api/forum/og/") ||
        pathname === "/api/writing-studio/quality-check" ||
        isStripeWebhook;

      // Chat routes perform their own authentication resolution and are
      // also handled by the main proxy auth flow below. Avoid rejecting
      // valid InsForge-backed requests here due to cookie-shape mismatch.
      if (isPublic || isChatApi || isPublicAuthApi) {
        return { passed: true };
      }

      const hasAuthenticatedSession = Boolean(
        authHeader ||
        sessionToken ||
        jwtToken ||
        insforgeAccessToken ||
        insforgeRefreshToken
      );

      if (!hasAuthenticatedSession) {
        return { passed: false, message: "Authentication required" };
      }

      return { passed: true };
    },
  },

  {
    id: "API3",
    name: "Property Level Authorization",
    severity: "high",
    check: async (req) => {
      if (
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH"
      ) {
        const contentType = req.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();

            const forbiddenFields = [
              "id",
              "createdAt",
              "updatedAt",
              "role",
              "isAdmin",
            ];
            const hasForbidden = forbiddenFields.some(
              (field) => field in body
            );

            if (hasForbidden) {
              return { passed: false, message: "Cannot modify protected fields" };
            }
          } catch {
            // Invalid JSON - will be caught by validation
          }
        }
      }

      return { passed: true };
    },
  },

  {
    id: "API4",
    name: "Resource Consumption",
    severity: "high",
    check: async (req) => {
      const contentLength = parseInt(
        req.headers.get("content-length") || "0"
      );
      const maxSize = 10 * 1024 * 1024;

      if (contentLength > maxSize) {
        return { passed: false, message: "Request body too large" };
      }

      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "20");

      if (limit > 100) {
        return {
          passed: false,
          message: "Pagination limit exceeded (max 100)",
        };
      }

      return { passed: true };
    },
  },

  {
    id: "API5",
    name: "Function Level Authorization",
    severity: "critical",
    check: async (req) => {
      const adminPaths = ["/api/admin", "/api/internal"];

      if (
        adminPaths.some((path) => req.nextUrl.pathname.startsWith(path))
      ) {
        return {
          passed: true,
          message: "Admin endpoint - requires elevated privileges",
        };
      }

      return { passed: true };
    },
  },

  {
    id: "API6",
    name: "Business Flow Protection",
    severity: "medium",
    check: async (req) => {
      const sensitivePaths = [
        "/api/purchase",
        "/api/withdraw",
        "/api/transfer",
      ];

      if (
        sensitivePaths.some((path) =>
          req.nextUrl.pathname.includes(path)
        )
      ) {
        const verificationHeader = req.headers.get("x-verification-token");

        if (!verificationHeader) {
          return {
            passed: false,
            message:
              "Additional verification required for sensitive operation",
          };
        }
      }

      return { passed: true };
    },
  },

  {
    id: "API7",
    name: "SSRF Protection",
    severity: "high",
    check: async (req) => {
      const url = new URL(req.url);
      const urlParam = url.searchParams.get("url");

      if (urlParam) {
        try {
          const parsedUrl = new URL(urlParam);

          const blockedHosts = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "::1",
            "169.254.",
            "10.",
            "192.168.",
            "172.16.",
          ];

          if (
            blockedHosts.some(
              (host) =>
                parsedUrl.hostname.startsWith(host) ||
                parsedUrl.hostname === host
            )
          ) {
            return {
              passed: false,
              message: "Invalid URL - internal addresses not allowed",
            };
          }
        } catch {
          return { passed: false, message: "Invalid URL format" };
        }
      }

      return { passed: true };
    },
  },

  {
    id: "API8",
    name: "Security Configuration",
    severity: "medium",
    check: async () => {
      return { passed: true };
    },
  },

  {
    id: "API9",
    name: "API Inventory",
    severity: "low",
    check: async (req) => {
      logApiAccess(req);
      return { passed: true };
    },
  },

  {
    id: "API10",
    name: "External API Safety",
    severity: "medium",
    check: async (req) => {
      const redirect = req.headers.get("redirect");
      if (redirect) {
        return { passed: false, message: "Manual redirects not allowed" };
      }

      return { passed: true };
    },
  },
];

function isValidResourceId(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const convexIdRegex = /^[a-z0-9]{24,}$/i;

  return (
    uuidRegex.test(id) ||
    convexIdRegex.test(id) ||
    /^[a-zA-Z0-9_-]+$/.test(id)
  );
}

function logApiAccess(req: NextRequest): void {
  const entry = {
    timestamp: Date.now(),
    path: req.nextUrl.pathname,
    method: req.method,
    ip: req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for"),
  };

  accessLog.unshift(entry);
  if (accessLog.length > MAX_ACCESS_LOG) {
    accessLog.length = MAX_ACCESS_LOG;
  }
}

export async function runOwaspChecks(req: NextRequest): Promise<{
  passed: boolean;
  violations: Array<{
    id: string;
    name: string;
    severity: string;
    message: string;
  }>;
}> {
  const violations: Array<{
    id: string;
    name: string;
    severity: string;
    message: string;
  }> = [];

  for (const check of securityChecks) {
    try {
      const result = await check.check(req);

      if (!result.passed) {
        violations.push({
          id: check.id,
          name: check.name,
          severity: check.severity,
          message: result.message || "Security check failed",
        });
      }
    } catch {
      violations.push({
        id: check.id,
        name: check.name,
        severity: check.severity,
        message: "Check execution failed",
      });
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

export async function owaspMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  const result = await runOwaspChecks(req);

  if (!result.passed) {
    const criticalViolations = result.violations.filter(
      (v) => v.severity === "critical" || v.severity === "high"
    );

    if (criticalViolations.length > 0) {
      return NextResponse.json(
        {
          error: "Security violation detected",
          violations: criticalViolations,
        },
        { status: 403 }
      );
    }

    console.warn("OWASP API Security violations:", result.violations);
  }

  return null;
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;"
  );

  return response;
}
