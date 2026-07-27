type ProfileName = "smoke" | "load" | "stress";
type ScenarioName =
  | "health"
  | "health-metrics"
  | "chat"
  | "chat-sync"
  | "hermes-sessions"
  | "hermes-runs";

type Profile = {
  durationSeconds: number;
  concurrency: number;
  rampDelayMs: number;
  maxRequests?: number;
};

type ScenarioConfig = {
  name: ScenarioName;
  method: "GET" | "POST";
  path: string;
  headers: Record<string, string>;
  body?: string;
};

type Sample = {
  status: number;
  durationMs: number;
  ok: boolean;
  error?: string;
};

type Summary = {
  profile: ProfileName;
  scenario: ScenarioName;
  baseUrl: string;
  durationSeconds: number;
  concurrency: number;
  startedAt: string;
  finishedAt: string;
  totalRequests: number;
  okRequests: number;
  failedRequests: number;
  errorRate: number;
  rateLimitedRequests: number;
  rateLimitRate: number;
  requestsPerSecond: number;
  latencyMs: {
    min: number | null;
    avg: number | null;
    p50: number | null;
    p95: number | null;
    p99: number | null;
    max: number | null;
  };
  statuses: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
};

const profiles: Record<ProfileName, Profile> = {
  smoke: {
    durationSeconds: 15,
    concurrency: 2,
    rampDelayMs: 250,
    maxRequests: 20,
  },
  load: {
    durationSeconds: 60,
    concurrency: 8,
    rampDelayMs: 100,
  },
  stress: {
    durationSeconds: 120,
    concurrency: 20,
    rampDelayMs: 25,
  },
};

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function percentile(values: number[], ratio: number): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );

  return sorted[index];
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function parseJsonEnv<T>(name: string, fallback: T): T {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(
      `[load] Ignoring invalid ${name}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return fallback;
  }
}

function resolveScenario(profileName: ProfileName): ScenarioName {
  const argScenario = getArg("--scenario") as ScenarioName | undefined;
  const envScenario = process.env.LOAD_CHAT_SCENARIO as
    | ScenarioName
    | undefined;

  if (argScenario || envScenario) {
    return (argScenario || envScenario)!;
  }

  const hasAuthMaterial = Boolean(
    process.env.LOAD_AUTH_COOKIE ||
      process.env.LOAD_BEARER_TOKEN ||
      process.env.LOAD_HEADERS_JSON,
  );

  if (profileName === "smoke") {
    return "health";
  }

  return hasAuthMaterial ? "chat" : "health";
}

function buildScenario(baseUrl: string, scenario: ScenarioName): ScenarioConfig {
  const headers = parseJsonEnv<Record<string, string>>("LOAD_HEADERS_JSON", {});
  const contentTypeHeaders = { "Content-Type": "application/json" };
  const authCookie = process.env.LOAD_AUTH_COOKIE;
  const bearerToken = process.env.LOAD_BEARER_TOKEN;
  const adminKey = process.env.LOAD_ADMIN_KEY;

  if (authCookie) {
    headers.Cookie = authCookie;
  }

  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }

  switch (scenario) {
    case "health":
      return {
        name: scenario,
        method: "GET",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/health`,
        headers,
      };
    case "health-metrics":
      if (adminKey) {
        headers["x-admin-key"] = adminKey;
      }
      return {
        name: scenario,
        method: "GET",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/health?metrics=true`,
        headers,
      };
    case "hermes-sessions":
      return {
        name: scenario,
        method: "GET",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/hermes/sessions?limit=5`,
        headers,
      };
    case "hermes-runs":
      return {
        name: scenario,
        method: "POST",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/hermes/runs`,
        headers: {
          ...headers,
          ...contentTypeHeaders,
        },
        body:
          process.env.LOAD_REQUEST_BODY ||
          JSON.stringify({
            workspaceId: "load-test-workspace",
            domain: "chat",
            metadata: {
              source: "scalable-chat-load-test",
            },
          }),
      };
    case "chat-sync":
      return {
        name: "chat-sync",
        method: "GET",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/chat/sync?since=0&conversationLimit=10&messageLimit=50`,
        headers,
      };
    case "chat":
    default:
      return {
        name: "chat",
        method: "POST",
        path:
          process.env.LOAD_TARGET_PATH ||
          `${baseUrl.replace(/\/$/, "")}/api/chat`,
        headers: {
          ...headers,
          ...contentTypeHeaders,
        },
        body:
          process.env.LOAD_REQUEST_BODY ||
          JSON.stringify({
            surface: "flagship",
            messages: [
              {
                role: "user",
                content:
                  "Return a short validation response confirming the scalable chat runtime is available.",
              },
            ],
          }),
      };
  }
}

async function runRequest(config: ScenarioConfig): Promise<Sample> {
  const startedAt = Date.now();

  try {
    const response = await fetch(config.path, {
      method: config.method,
      headers: config.headers,
      body: config.body,
    });

    return {
      status: response.status,
      durationMs: Date.now() - startedAt,
      ok: response.ok,
      error: response.ok ? undefined : `${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      status: 0,
      durationMs: Date.now() - startedAt,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const profileName = (getArg("--profile") || "smoke") as ProfileName;
  const profile = profiles[profileName];

  if (!profile) {
    throw new Error(
      `Unknown profile "${profileName}". Expected one of: ${Object.keys(
        profiles,
      ).join(", ")}`,
    );
  }

  const baseUrl = process.env.LOAD_BASE_URL || "http://localhost:3000";
  const scenarioName = resolveScenario(profileName);
  const scenario = buildScenario(baseUrl, scenarioName);
  const overrideConcurrency = Number.parseInt(
    process.env.LOAD_CONCURRENCY || "",
    10,
  );
  const overrideDuration = Number.parseInt(
    process.env.LOAD_DURATION_SECONDS || "",
    10,
  );
  const maxRequestsOverride = Number.parseInt(
    process.env.LOAD_MAX_REQUESTS || "",
    10,
  );

  const concurrency =
    Number.isFinite(overrideConcurrency) && overrideConcurrency > 0
      ? overrideConcurrency
      : profile.concurrency;
  const durationSeconds =
    Number.isFinite(overrideDuration) && overrideDuration > 0
      ? overrideDuration
      : profile.durationSeconds;
  const maxRequests =
    Number.isFinite(maxRequestsOverride) && maxRequestsOverride > 0
      ? maxRequestsOverride
      : profile.maxRequests;

  const startedAt = new Date();
  const deadline = Date.now() + durationSeconds * 1000;
  const samples: Sample[] = [];
  let issuedRequests = 0;

  console.log(
    `[load] profile=${profileName} scenario=${scenarioName} url=${scenario.path} concurrency=${concurrency} durationSeconds=${durationSeconds}`,
  );

  const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
    while (Date.now() < deadline) {
      if (maxRequests && issuedRequests >= maxRequests) {
        return;
      }

      issuedRequests += 1;
      const sample = await runRequest(scenario);
      samples.push(sample);

      if (profile.rampDelayMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, workerIndex === 0 ? 0 : profile.rampDelayMs),
        );
      }
    }
  });

  await Promise.all(workers);

  const finishedAt = new Date();
  const durations = samples.map((sample) => sample.durationMs);
  const okRequests = samples.filter((sample) => sample.ok).length;
  const rateLimitedRequests = samples.filter(
    (sample) => sample.status === 429,
  ).length;
  const errorCounts = new Map<string, number>();
  const statuses = samples.reduce<Record<string, number>>((acc, sample) => {
    const key = String(sample.status);
    acc[key] = (acc[key] || 0) + 1;
    if (sample.error) {
      errorCounts.set(sample.error, (errorCounts.get(sample.error) || 0) + 1);
    }
    return acc;
  }, {});

  const summary: Summary = {
    profile: profileName,
    scenario: scenarioName,
    baseUrl,
    durationSeconds,
    concurrency,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    totalRequests: samples.length,
    okRequests,
    failedRequests: samples.length - okRequests,
    errorRate: samples.length === 0 ? 0 : (samples.length - okRequests) / samples.length,
    rateLimitedRequests,
    rateLimitRate:
      samples.length === 0 ? 0 : rateLimitedRequests / samples.length,
    requestsPerSecond:
      durationSeconds === 0 ? 0 : Number((samples.length / durationSeconds).toFixed(2)),
    latencyMs: {
      min: durations.length ? Math.min(...durations) : null,
      avg: average(durations),
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      p99: percentile(durations, 0.99),
      max: durations.length ? Math.max(...durations) : null,
    },
    statuses,
    topErrors: [...errorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count })),
  };

  console.log(JSON.stringify(summary, null, 2));

  const maxP95Ms = Number.parseFloat(process.env.LOAD_ASSERT_MAX_P95_MS || "");
  const maxErrorRate = Number.parseFloat(
    process.env.LOAD_ASSERT_MAX_ERROR_RATE || "",
  );
  const maxRateLimitRate = Number.parseFloat(
    process.env.LOAD_ASSERT_MAX_RATE_LIMIT_RATE || "",
  );

  let failed = false;

  if (Number.isFinite(maxP95Ms) && (summary.latencyMs.p95 ?? 0) > maxP95Ms) {
    console.error(
      `[load] p95 latency ${summary.latencyMs.p95}ms exceeded ${maxP95Ms}ms`,
    );
    failed = true;
  }

  if (
    Number.isFinite(maxErrorRate) &&
    summary.errorRate > maxErrorRate
  ) {
    console.error(
      `[load] error rate ${summary.errorRate.toFixed(4)} exceeded ${maxErrorRate.toFixed(4)}`,
    );
    failed = true;
  }

  if (
    Number.isFinite(maxRateLimitRate) &&
    summary.rateLimitRate > maxRateLimitRate
  ) {
    console.error(
      `[load] rate-limit rate ${summary.rateLimitRate.toFixed(4)} exceeded ${maxRateLimitRate.toFixed(4)}`,
    );
    failed = true;
  }

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    `[load] execution failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
