import { NextRequest } from "next/server";

const DDOS_CONFIG = {
  WINDOW_SIZE_MS: 60000,
  MAX_REQUESTS_PER_WINDOW: 100,
  BURST_THRESHOLD: 20,
  BURST_WINDOW_MS: 10000,
  GLOBAL_MAX_RPS: 1000,
  AUTO_BLOCK_THRESHOLD: 500,
  AUTO_BLOCK_DURATION: 3600,
  CHALLENGE_THRESHOLD: 200,
};

interface DDoSCheck {
  allowed: boolean;
  action: "allow" | "challenge" | "block" | "rate-limit";
  reason?: string;
  retryAfter?: number;
}

interface BlockEntry {
  reason: string;
  expiresAt: number;
}

interface CounterEntry {
  count: number;
  expiresAt: number;
}

interface PatternEntry {
  timestamps: number[];
  expiresAt: number;
}

const blockStore = new Map<string, BlockEntry>();
const counterStore = new Map<string, CounterEntry>();
const patternStore = new Map<string, PatternEntry>();

function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

function getOrCreateCounter(key: string, ttlSeconds: number): number {
  const entry = counterStore.get(key);
  if (!entry || isExpired(entry.expiresAt)) {
    counterStore.set(key, { count: 1, expiresAt: Date.now() + ttlSeconds * 1000 });
    return 1;
  }
  entry.count++;
  return entry.count;
}

export async function checkDDoSProtection(
  req: NextRequest,
  userId?: string
): Promise<DDoSCheck> {
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = req.headers.get("user-agent") || "";

  const blockEntry = blockStore.get(`block:ddos:${clientIP}`);
  if (blockEntry && !isExpired(blockEntry.expiresAt)) {
    return {
      allowed: false,
      action: "block",
      reason: "IP blocked due to suspicious activity",
      retryAfter: Math.ceil((blockEntry.expiresAt - Date.now()) / 1000),
    };
  }

  const globalCount = getOrCreateCounter(
    `ratelimit:global:${Math.floor(Date.now() / 1000)}`,
    2
  );
  if (globalCount > DDOS_CONFIG.GLOBAL_MAX_RPS) {
    return {
      allowed: false,
      action: "rate-limit",
      reason: "Server overloaded, try again later",
      retryAfter: 2,
    };
  }

  const burstCount = getOrCreateCounter(
    `burst:${clientIP}:${Math.floor(Date.now() / DDOS_CONFIG.BURST_WINDOW_MS)}`,
    DDOS_CONFIG.BURST_WINDOW_MS / 1000
  );
  if (burstCount > DDOS_CONFIG.BURST_THRESHOLD) {
    blockStore.set(`block:ddos:${clientIP}`, {
      reason: "burst",
      expiresAt: Date.now() + DDOS_CONFIG.AUTO_BLOCK_DURATION * 1000,
    });
    return {
      allowed: false,
      action: "block",
      reason: "Burst attack detected",
      retryAfter: DDOS_CONFIG.AUTO_BLOCK_DURATION,
    };
  }

  const windowCount = getOrCreateCounter(
    `window:${clientIP}:${Math.floor(Date.now() / DDOS_CONFIG.WINDOW_SIZE_MS)}`,
    60
  );
  if (windowCount > DDOS_CONFIG.AUTO_BLOCK_THRESHOLD) {
    blockStore.set(`block:ddos:${clientIP}`, {
      reason: "excessive",
      expiresAt: Date.now() + DDOS_CONFIG.AUTO_BLOCK_DURATION * 1000,
    });
    return {
      allowed: false,
      action: "block",
      reason: "Excessive requests detected",
      retryAfter: DDOS_CONFIG.AUTO_BLOCK_DURATION,
    };
  }

  if (windowCount > DDOS_CONFIG.CHALLENGE_THRESHOLD) {
    return {
      allowed: false,
      action: "challenge",
      reason: "Please verify you're human",
    };
  }

  const botCheck = detectBot(clientIP, userAgent, req);
  if (!botCheck.allowed) {
    return botCheck;
  }

  return { allowed: true, action: "allow" };
}

function detectBot(
  ip: string,
  userAgent: string,
  req: NextRequest
): DDoSCheck {
  if (!userAgent || userAgent.length < 10) {
    blockStore.set(`block:ddos:${ip}`, {
      reason: "no_ua",
      expiresAt: Date.now() + 3600 * 1000,
    });
    return { allowed: false, action: "block", reason: "Invalid client" };
  }

  const botSignatures = [
    "sqlmap", "nikto", "nmap", "masscan", "zgrab",
    "crawler", "spider", "scraper",
  ];
  const uaLower = userAgent.toLowerCase();
  if (botSignatures.some((sig) => uaLower.includes(sig))) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return {
        allowed: false,
        action: "challenge",
        reason: "Automated traffic detected",
      };
    }
  }

  const patternKey = `pattern:${ip}`;
  const now = Date.now();
  let patternEntry = patternStore.get(patternKey);
  if (!patternEntry || isExpired(patternEntry.expiresAt)) {
    patternEntry = { timestamps: [], expiresAt: now + 300 * 1000 };
  }
  patternEntry.timestamps.push(now);
  if (patternEntry.timestamps.length > 100) {
    patternEntry.timestamps = patternEntry.timestamps.slice(-100);
  }
  patternStore.set(patternKey, patternEntry);

  if (patternEntry.timestamps.length >= 10) {
    const recent = patternEntry.timestamps.slice(-10);
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(recent[i] - recent[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) /
      intervals.length;

    if (variance < 100 && avgInterval < 1000) {
      blockStore.set(`block:ddos:${ip}`, {
        reason: "pattern",
        expiresAt: now + 3600 * 1000,
      });
      return { allowed: false, action: "block", reason: "Automated pattern detected" };
    }
  }

  return { allowed: true, action: "allow" };
}

export async function getDDoSStats(): Promise<{
  blockedIPs: number;
  recentEvents: number;
  topThreats: Array<{ ip: string; count: number }>;
}> {
  const now = Date.now();
  let blockedIPs = 0;
  for (const [, entry] of blockStore) {
    if (!isExpired(entry.expiresAt)) blockedIPs++;
  }
  return { blockedIPs, recentEvents: 0, topThreats: [] };
}

export async function blockIP(
  ip: string,
  duration: number = 3600,
  reason: string
): Promise<void> {
  blockStore.set(`block:ddos:${ip}`, {
    reason,
    expiresAt: Date.now() + duration * 1000,
  });
}

export async function unblockIP(ip: string): Promise<void> {
  blockStore.delete(`block:ddos:${ip}`);
}
