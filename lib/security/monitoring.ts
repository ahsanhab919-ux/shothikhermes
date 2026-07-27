import { NextRequest } from "next/server";

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: "auth_failure" | "rate_limit" | "suspicious" | "violation" | "error";
  severity: "low" | "medium" | "high" | "critical";
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
  };
  details: {
    path: string;
    method: string;
    description: string;
    metadata?: Record<string, unknown>;
  };
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  authFailures: number;
  rateLimitHits: number;
  suspiciousActivity: number;
  violations: number;
  avgResponseTime: number;
  errorRate: number;
}

const eventLog: SecurityEvent[] = [];
const MAX_EVENTS = 10000;

const ipRequestCounts = new Map<string, { count: number; expiresAt: number }>();
const blockedIPs = new Map<string, { reason: string; expiresAt: number }>();

export function getRequestIp(
  req: Pick<NextRequest, "headers"> & { ip?: string | null }
): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    const trimmed = first?.trim();
    if (trimmed) return trimmed;
  }
  return req.ip || "unknown";
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function logSecurityEvent(
  event: Omit<SecurityEvent, "id" | "timestamp">
): Promise<void> {
  const fullEvent: SecurityEvent = {
    ...event,
    id: generateEventId(),
    timestamp: Date.now(),
  };

  eventLog.unshift(fullEvent);
  if (eventLog.length > MAX_EVENTS) {
    eventLog.length = MAX_EVENTS;
  }

  if (event.severity === "critical") {
    console.error("CRITICAL SECURITY EVENT:", fullEvent);
  }
}

export async function getSecurityMetrics(
  days: number = 7
): Promise<SecurityMetrics> {
  const cutoff = Date.now() - days * 86400 * 1000;
  const recent = eventLog.filter((e) => e.timestamp > cutoff);

  const metrics: SecurityMetrics = {
    totalRequests: recent.length,
    blockedRequests: 0,
    authFailures: 0,
    rateLimitHits: 0,
    suspiciousActivity: 0,
    violations: 0,
    avgResponseTime: 0,
    errorRate: 0,
  };

  for (const event of recent) {
    if (event.type === "auth_failure") {
      metrics.authFailures++;
      metrics.blockedRequests++;
    } else if (event.type === "rate_limit") {
      metrics.rateLimitHits++;
      metrics.blockedRequests++;
    } else if (event.type === "suspicious") {
      metrics.suspiciousActivity++;
    } else if (event.type === "violation") {
      metrics.violations++;
      metrics.blockedRequests++;
    }
  }

  return metrics;
}

export async function getRecentEvents(
  limit: number = 100,
  type?: SecurityEvent["type"]
): Promise<SecurityEvent[]> {
  const events = type ? eventLog.filter((e) => e.type === type) : eventLog;
  return events.slice(0, limit);
}

export async function detectSuspiciousActivity(
  req: NextRequest,
  userId?: string
): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  action: "allow" | "warn" | "block";
}> {
  const reasons: string[] = [];
  const ip = getRequestIp(req);

  const now = Date.now();
  const ipEntry = ipRequestCounts.get(ip);
  if (!ipEntry || ipEntry.expiresAt < now) {
    ipRequestCounts.set(ip, { count: 1, expiresAt: now + 60000 });
  } else {
    ipEntry.count++;
    if (ipEntry.count > 100) {
      reasons.push("Excessive requests from single IP");
    }
  }

  const userAgent = req.headers.get("user-agent") || "";
  const suspiciousAgents = ["sqlmap", "nikto", "nmap", "masscan", "zgrab"];
  if (suspiciousAgents.some((agent) => userAgent.toLowerCase().includes(agent))) {
    reasons.push("Suspicious user agent detected");
  }

  const path = req.nextUrl.pathname;
  if (path.includes("..") || path.includes("%2e%2e")) {
    reasons.push("Path traversal attempt detected");
  }

  let action: "allow" | "warn" | "block" = "allow";
  if (reasons.length >= 3) {
    action = "block";
  } else if (reasons.length >= 1) {
    action = "warn";
  }

  if (reasons.length > 0) {
    await logSecurityEvent({
      type: "suspicious",
      severity: action === "block" ? "high" : "medium",
      source: {
        ip,
        userAgent: userAgent || undefined,
        userId,
      },
      details: {
        path,
        method: req.method,
        description: reasons.join("; "),
      },
    });
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
    action,
  };
}

export async function blockIP(
  ip: string,
  duration: number = 3600,
  reason: string
): Promise<void> {
  blockedIPs.set(ip, { reason, expiresAt: Date.now() + duration * 1000 });

  await logSecurityEvent({
    type: "violation",
    severity: "high",
    source: { ip },
    details: {
      path: "N/A",
      method: "N/A",
      description: `IP blocked: ${reason}`,
      metadata: { duration },
    },
  });
}

export async function isIPBlocked(ip: string): Promise<{
  blocked: boolean;
  reason?: string;
  expiresAt?: number;
}> {
  const entry = blockedIPs.get(ip);
  if (!entry) return { blocked: false };

  if (entry.expiresAt < Date.now()) {
    blockedIPs.delete(ip);
    return { blocked: false };
  }

  return {
    blocked: true,
    reason: entry.reason,
    expiresAt: entry.expiresAt,
  };
}

export async function getSecurityDashboard(): Promise<{
  metrics: SecurityMetrics;
  recentEvents: SecurityEvent[];
  topThreats: Array<{ type: string; count: number }>;
  blockedIPs: number;
}> {
  const [metrics, recentEvents] = await Promise.all([
    getSecurityMetrics(7),
    getRecentEvents(50),
  ]);

  const threatCounts: Record<string, number> = {};
  recentEvents.forEach((event) => {
    threatCounts[event.type] = (threatCounts[event.type] || 0) + 1;
  });

  const topThreats = Object.entries(threatCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const now = Date.now();
  let blockedCount = 0;
  for (const [, entry] of blockedIPs) {
    if (entry.expiresAt > now) blockedCount++;
  }

  return {
    metrics,
    recentEvents,
    topThreats,
    blockedIPs: blockedCount,
  };
}
