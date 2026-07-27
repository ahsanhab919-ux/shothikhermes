import { NextRequest, NextResponse } from "next/server";
import { getChatRuntimeSummary, getMetricsSnapshot } from "@/lib/runtime-metrics";
import { getCacheStats } from "@/lib/result-cache";
import { getAllCircuitStatuses } from "@/lib/ai-gateway";
import { diagnoseConvexJwtConfig } from "@/lib/convex/auth-diagnostics";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://prod-api.shothik.ai";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";

const MICROSERVICES = [
  { name: "nlp", url: process.env.NLP_SERVICE_URL || "http://localhost:3001" },
  { name: "ai-detector", url: process.env.AI_DETECTOR_SERVICE_URL || "http://localhost:3002" },
  { name: "calibre", url: process.env.CALIBRE_SERVICE_URL || "http://localhost:3003" },
  { name: "sheet", url: process.env.SHEET_SERVICE_URL || "http://localhost:3004" },
];

async function checkMicroservice(
  name: string,
  baseUrl: string
): Promise<{ name: string; status: string; latencyMs: number; uptime?: number; dependencies?: Record<string, string>; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { name, status: "degraded", latencyMs, error: `HTTP ${res.status}` };
    }
    const body = await res.json().catch(() => ({}));
    return {
      name,
      status: body.status === "ok" ? "healthy" : "degraded",
      latencyMs,
      uptime: body.uptime,
      dependencies: body.services || body.dependencies,
    };
  } catch (err) {
    return {
      name,
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unreachable",
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const deep = searchParams.get("deep") === "true";
  const metrics = searchParams.get("metrics") === "true";

  if (metrics) {
    const isDevEnv = process.env.NODE_ENV === "development";
    const adminKey = request.headers.get("x-admin-key");
    const validAdminKey = process.env.METRICS_ADMIN_KEY;

    if (!isDevEnv && (!validAdminKey || adminKey !== validAdminKey)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      metrics: getMetricsSnapshot(),
      chatRuntime: getChatRuntimeSummary(),
      caches: getCacheStats(),
      circuits: getAllCircuitStatuses(),
      timestamp: new Date().toISOString(),
    });
  }

  if (!deep) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  const backendCheck = async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      checks.backend = {
        status: res.ok ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      checks.backend = {
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Connection failed",
      };
    }
  };

  const convexCheck = async () => {
    if (!CONVEX_URL) {
      checks.convex = { status: "not_configured" };
      return;
    }
    const start = Date.now();
    try {
      const siteUrl = CONVEX_URL.replace(".convex.cloud", ".convex.site");
      const res = await fetch(siteUrl, {
        signal: AbortSignal.timeout(5000),
      });
      checks.convex = {
        status: res.status < 500 ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      checks.convex = {
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Connection failed",
      };
    }
  };

  const envCheck = () => {
    const required = ["JWT_PRIVATE_KEY", "NEXT_PUBLIC_CONVEX_URL"];
    const missing = required.filter((key) => !process.env[key]);
    checks.environment = {
      status: missing.length === 0 ? "healthy" : "degraded",
      ...(missing.length > 0 && { error: `Missing: ${missing.join(", ")}` }),
    };

    const convexAuth = diagnoseConvexJwtConfig();
    checks["convex:auth"] = {
      status: convexAuth.status,
      ...(convexAuth.status !== "healthy" && { error: convexAuth.message }),
    };
  };

  const serviceCheckPromises = MICROSERVICES.map(({ name, url }) =>
    checkMicroservice(name, url)
  );

  const [serviceStatuses] = await Promise.all([
    Promise.all(serviceCheckPromises),
    backendCheck(),
    convexCheck(),
  ]);

  for (const result of serviceStatuses) {
    checks[`service:${result.name}`] = {
      status: result.status,
      latencyMs: result.latencyMs,
      error: result.error,
    };
  }

  envCheck();

  const overallStatus = Object.values(checks).every(
    (c) => c.status === "healthy" || c.status === "not_configured"
  )
    ? "healthy"
    : Object.values(checks).some((c) => c.status === "unhealthy")
    ? "unhealthy"
    : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      services: serviceStatuses,
    },
    { status: overallStatus === "unhealthy" ? 503 : 200 }
  );
}
