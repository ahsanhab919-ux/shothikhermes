import { logger } from "./logger";

interface CounterMetric {
  count: number;
  lastOccurred: number;
}

interface GaugeMetric {
  value: number;
  lastUpdated: number;
}

interface DistributionMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdated: number;
  samples: number[];
}

interface DistributionSnapshot {
  count: number;
  sum: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  lastUpdated: number;
}

interface MetricsSnapshot {
  counters: Record<string, CounterMetric>;
  gauges: Record<string, GaugeMetric>;
  distributions: Record<string, DistributionSnapshot>;
  collectedAt: number;
  uptimeMs: number;
}

interface ChatRuntimeSummary {
  requests: {
    total: number;
    success: number;
    rateLimited: number;
    unauthorized: number;
    validationFailed: number;
    serverErrors: number;
    active: number;
  };
  latencyMs: DistributionSnapshot;
  usageTracking: {
    successfulWrites: number;
    failedWrites: number;
    totalTokens: number;
    totalCostUsd: number;
    perCall: DistributionSnapshot;
  };
  generatedAt: string;
}

const counters = new Map<string, CounterMetric>();
const gauges = new Map<string, GaugeMetric>();
const distributions = new Map<string, DistributionMetric>();
const startTime = Date.now();
const MAX_DISTRIBUTION_SAMPLES = 512;

export function incrementCounter(name: string, amount: number = 1): void {
  const existing = counters.get(name);
  if (existing) {
    existing.count += amount;
    existing.lastOccurred = Date.now();
  } else {
    counters.set(name, { count: amount, lastOccurred: Date.now() });
  }
}

export function setGauge(name: string, value: number): void {
  gauges.set(name, { value, lastUpdated: Date.now() });
}

export function adjustGauge(name: string, delta: number): number {
  const current = gauges.get(name)?.value ?? 0;
  const next = Math.max(0, current + delta);
  setGauge(name, next);
  return next;
}

export function recordDistribution(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    return;
  }

  const now = Date.now();
  const existing = distributions.get(name);

  if (existing) {
    existing.count += 1;
    existing.sum += value;
    existing.min = Math.min(existing.min, value);
    existing.max = Math.max(existing.max, value);
    existing.lastUpdated = now;
    existing.samples.push(value);
    if (existing.samples.length > MAX_DISTRIBUTION_SAMPLES) {
      existing.samples.shift();
    }
    return;
  }

  distributions.set(name, {
    count: 1,
    sum: value,
    min: value,
    max: value,
    lastUpdated: now,
    samples: [value],
  });
}

function percentile(samples: number[], percentileValue: number): number | null {
  if (samples.length === 0) {
    return null;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(percentileValue * sorted.length) - 1),
  );

  return sorted[index];
}

function toDistributionSnapshot(
  metric?: DistributionMetric,
): DistributionSnapshot {
  if (!metric) {
    return {
      count: 0,
      sum: 0,
      min: null,
      max: null,
      avg: null,
      p50: null,
      p95: null,
      p99: null,
      lastUpdated: 0,
    };
  }

  return {
    count: metric.count,
    sum: metric.sum,
    min: metric.count > 0 ? metric.min : null,
    max: metric.count > 0 ? metric.max : null,
    avg: metric.count > 0 ? metric.sum / metric.count : null,
    p50: percentile(metric.samples, 0.5),
    p95: percentile(metric.samples, 0.95),
    p99: percentile(metric.samples, 0.99),
    lastUpdated: metric.lastUpdated,
  };
}

export function getCounterValue(name: string): number {
  return counters.get(name)?.count ?? 0;
}

export function getGaugeValue(name: string): number {
  return gauges.get(name)?.value ?? 0;
}

export function getDistributionSnapshot(name: string): DistributionSnapshot {
  return toDistributionSnapshot(distributions.get(name));
}

export function getChatRuntimeSummary(): ChatRuntimeSummary {
  return {
    requests: {
      total: getCounterValue("chat.requests.total"),
      success: getCounterValue("chat.responses.200"),
      rateLimited: getCounterValue("chat.responses.429"),
      unauthorized: getCounterValue("chat.responses.401"),
      validationFailed: getCounterValue("chat.responses.400"),
      serverErrors: getCounterValue("chat.responses.500"),
      active: getGaugeValue("chat.requests.active"),
    },
    latencyMs: getDistributionSnapshot("chat.request.duration_ms"),
    usageTracking: {
      successfulWrites: getCounterValue("llm.usage.track.success"),
      failedWrites: getCounterValue("llm.usage.track.failure"),
      totalTokens: getCounterValue("llm.usage.tokens.total"),
      totalCostUsd: getCounterValue("llm.usage.cost_usd.total"),
      perCall: getDistributionSnapshot("llm.usage.cost_usd.per_call"),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const snapshot: MetricsSnapshot = {
    counters: {},
    gauges: {},
    distributions: {},
    collectedAt: Date.now(),
    uptimeMs: Date.now() - startTime,
  };

  for (const [name, metric] of counters) {
    snapshot.counters[name] = { ...metric };
  }
  for (const [name, metric] of gauges) {
    snapshot.gauges[name] = { ...metric };
  }
  for (const [name, metric] of distributions) {
    snapshot.distributions[name] = toDistributionSnapshot(metric);
  }

  return snapshot;
}

export function resetMetrics(): void {
  counters.clear();
  gauges.clear();
  distributions.clear();
}

const LOG_INTERVAL_MS = 5 * 60 * 1000;
let lastLogTime = 0;

export function maybeLogMetrics(): void {
  const now = Date.now();
  if (now - lastLogTime < LOG_INTERVAL_MS) return;
  lastLogTime = now;

  const snapshot = getMetricsSnapshot();
  const nonZeroCounters: Record<string, number> = {};
  for (const [name, metric] of Object.entries(snapshot.counters)) {
    if (metric.count > 0) nonZeroCounters[name] = metric.count;
  }

  if (Object.keys(nonZeroCounters).length > 0) {
    logger.info("Runtime metrics", {
      counters: nonZeroCounters,
      gauges: Object.fromEntries(
        Object.entries(snapshot.gauges).map(([k, v]) => [k, v.value])
      ),
      distributions: Object.fromEntries(
        Object.entries(snapshot.distributions)
          .filter(([, value]) => value.count > 0)
          .map(([name, value]) => [
            name,
            {
              count: value.count,
              avg: value.avg,
              p95: value.p95,
              max: value.max,
            },
          ]),
      ),
      uptimeMin: Math.round(snapshot.uptimeMs / 60_000),
    });
  }
}
