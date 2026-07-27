import { logger } from "./logger";
import type { ToolName } from "./ai-gateway";
import { incrementCounter, setGauge } from "./runtime-metrics";

export type UserTier = "free" | "starter" | "pro" | "enterprise";

interface TierLimits {
  perHour: number;
  perDay: number;
}

const TOOL_TIER_LIMITS: Record<ToolName, Record<UserTier, TierLimits>> = {
  paraphrase: {
    free: { perHour: 10, perDay: 50 },
    starter: { perHour: 30, perDay: 200 },
    pro: { perHour: 100, perDay: 1000 },
    enterprise: { perHour: 500, perDay: 5000 },
  },
  plagiarism: {
    free: { perHour: 5, perDay: 20 },
    starter: { perHour: 15, perDay: 100 },
    pro: { perHour: 50, perDay: 500 },
    enterprise: { perHour: 250, perDay: 2500 },
  },
  ai_detector: {
    free: { perHour: 10, perDay: 50 },
    starter: { perHour: 30, perDay: 200 },
    pro: { perHour: 100, perDay: 1000 },
    enterprise: { perHour: 500, perDay: 5000 },
  },
  grammar: {
    free: { perHour: 20, perDay: 100 },
    starter: { perHour: 60, perDay: 400 },
    pro: { perHour: 200, perDay: 2000 },
    enterprise: { perHour: 1000, perDay: 10000 },
  },
  humanize: {
    free: { perHour: 10, perDay: 50 },
    starter: { perHour: 30, perDay: 200 },
    pro: { perHour: 100, perDay: 1000 },
    enterprise: { perHour: 500, perDay: 5000 },
  },
  summarize: {
    free: { perHour: 10, perDay: 50 },
    starter: { perHour: 30, perDay: 200 },
    pro: { perHour: 100, perDay: 1000 },
    enterprise: { perHour: 500, perDay: 5000 },
  },
  translator: {
    free: { perHour: 10, perDay: 50 },
    starter: { perHour: 30, perDay: 200 },
    pro: { perHour: 100, perDay: 1000 },
    enterprise: { perHour: 500, perDay: 5000 },
  },
  ai_cowriter: {
    free: { perHour: 20, perDay: 100 },
    starter: { perHour: 60, perDay: 400 },
    pro: { perHour: 200, perDay: 2000 },
    enterprise: { perHour: 1000, perDay: 10000 },
  },
};

interface UsageRecord {
  timestamp: number;
  inputChars: number;
  cached: boolean;
  latencyMs: number;
}

interface UserToolUsage {
  records: UsageRecord[];
  lastCleanup: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const MAX_STORE_ENTRIES = 10_000;

const usageStore = new Map<string, UserToolUsage>();

function makeKey(userId: string, tool: ToolName): string {
  return `${userId}:${tool}`;
}

function cleanupOldRecords(usage: UserToolUsage): void {
  const now = Date.now();
  if (now - usage.lastCleanup < CLEANUP_INTERVAL_MS) return;

  usage.records = usage.records.filter((r) => now - r.timestamp < DAY_MS);
  usage.lastCleanup = now;
}

let lastGlobalCleanup = Date.now();
function globalCleanup(): void {
  const now = Date.now();
  if (now - lastGlobalCleanup < CLEANUP_INTERVAL_MS) return;
  lastGlobalCleanup = now;

  for (const [key, usage] of usageStore) {
    usage.records = usage.records.filter((r) => now - r.timestamp < DAY_MS);
    if (usage.records.length === 0) {
      usageStore.delete(key);
    }
  }

  if (usageStore.size > MAX_STORE_ENTRIES) {
    const excess = usageStore.size - MAX_STORE_ENTRIES;
    const keys = usageStore.keys();
    for (let i = 0; i < excess; i++) {
      const next = keys.next();
      if (!next.done) usageStore.delete(next.value);
    }
    incrementCounter("usage.store_evictions", excess);
  }

  setGauge("usage.store_size", usageStore.size);
}

function getUsage(userId: string, tool: ToolName): UserToolUsage {
  const key = makeKey(userId, tool);
  let usage = usageStore.get(key);
  if (!usage) {
    usage = { records: [], lastCleanup: Date.now() };
    usageStore.set(key, usage);
  }
  cleanupOldRecords(usage);
  return usage;
}

export interface UsageLimitResult {
  allowed: boolean;
  hourlyUsed: number;
  hourlyLimit: number;
  dailyUsed: number;
  dailyLimit: number;
  resetInMs: number;
  reason?: string;
}

export function checkUsageLimit(
  userId: string,
  tool: ToolName,
  tier: UserTier = "free"
): UsageLimitResult {
  globalCleanup();
  const limits = TOOL_TIER_LIMITS[tool]?.[tier];
  if (!limits) {
    return {
      allowed: true,
      hourlyUsed: 0,
      hourlyLimit: Infinity,
      dailyUsed: 0,
      dailyLimit: Infinity,
      resetInMs: 0,
    };
  }

  const usage = getUsage(userId, tool);
  const now = Date.now();
  const hourAgo = now - HOUR_MS;
  const dayAgo = now - DAY_MS;

  const hourlyRecords = usage.records.filter((r) => r.timestamp > hourAgo);
  const dailyRecords = usage.records.filter((r) => r.timestamp > dayAgo);

  const hourlyUsed = hourlyRecords.length;
  const dailyUsed = dailyRecords.length;

  if (hourlyUsed >= limits.perHour) {
    const oldestInHour = hourlyRecords[0];
    const resetInMs = oldestInHour
      ? oldestInHour.timestamp + HOUR_MS - now
      : HOUR_MS;
    return {
      allowed: false,
      hourlyUsed,
      hourlyLimit: limits.perHour,
      dailyUsed,
      dailyLimit: limits.perDay,
      resetInMs: Math.max(0, resetInMs),
      reason: `Hourly limit reached (${limits.perHour}/${tier} tier). Try again in ${Math.ceil(resetInMs / 60000)} minutes.`,
    };
  }

  if (dailyUsed >= limits.perDay) {
    const oldestInDay = dailyRecords[0];
    const resetInMs = oldestInDay
      ? oldestInDay.timestamp + DAY_MS - now
      : DAY_MS;
    return {
      allowed: false,
      hourlyUsed,
      hourlyLimit: limits.perHour,
      dailyUsed,
      dailyLimit: limits.perDay,
      resetInMs: Math.max(0, resetInMs),
      reason: `Daily limit reached (${limits.perDay}/${tier} tier). Upgrade your plan for higher limits.`,
    };
  }

  return {
    allowed: true,
    hourlyUsed,
    hourlyLimit: limits.perHour,
    dailyUsed,
    dailyLimit: limits.perDay,
    resetInMs: 0,
  };
}

export function recordUsage(
  userId: string,
  tool: ToolName,
  details: {
    inputChars: number;
    cached: boolean;
    latencyMs: number;
  }
): void {
  const usage = getUsage(userId, tool);
  usage.records.push({
    timestamp: Date.now(),
    inputChars: details.inputChars,
    cached: details.cached,
    latencyMs: details.latencyMs,
  });

  logger.info(
    `Usage recorded: ${tool} for user ${userId.substring(0, 8)}... (${details.cached ? "cached" : `${details.latencyMs}ms`})`
  );
}

export function getUserUsageSummary(
  userId: string
): Record<ToolName, { hourly: number; daily: number }> {
  const tools: ToolName[] = [
    "paraphrase",
    "plagiarism",
    "ai_detector",
    "grammar",
    "humanize",
    "summarize",
    "ai_cowriter",
  ];

  const now = Date.now();
  const hourAgo = now - HOUR_MS;
  const dayAgo = now - DAY_MS;

  const summary: Record<string, { hourly: number; daily: number }> = {};

  for (const tool of tools) {
    const usage = getUsage(userId, tool);
    summary[tool] = {
      hourly: usage.records.filter((r) => r.timestamp > hourAgo).length,
      daily: usage.records.filter((r) => r.timestamp > dayAgo).length,
    };
  }

  return summary as Record<ToolName, { hourly: number; daily: number }>;
}

export function clearUsage(userId: string, tool?: ToolName): void {
  if (tool) {
    usageStore.delete(makeKey(userId, tool));
  } else {
    const prefix = `${userId}:`;
    for (const key of usageStore.keys()) {
      if (key.startsWith(prefix)) {
        usageStore.delete(key);
      }
    }
  }
}

export function getToolLimits(
  tool: ToolName,
  tier: UserTier
): TierLimits | undefined {
  return TOOL_TIER_LIMITS[tool]?.[tier];
}
