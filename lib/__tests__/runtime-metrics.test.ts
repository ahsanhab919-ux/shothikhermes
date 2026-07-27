import { beforeEach, describe, expect, it } from "vitest";
import {
  adjustGauge,
  getChatRuntimeSummary,
  getDistributionSnapshot,
  incrementCounter,
  recordDistribution,
  resetMetrics,
} from "../runtime-metrics";

describe("runtime-metrics", () => {
  beforeEach(() => {
    resetMetrics();
  });

  it("tracks chat runtime counters and latency distributions", () => {
    incrementCounter("chat.requests.total");
    incrementCounter("chat.responses.200");
    incrementCounter("chat.responses.429", 2);
    incrementCounter("chat.responses.500");
    adjustGauge("chat.requests.active", 1);

    recordDistribution("chat.request.duration_ms", 120);
    recordDistribution("chat.request.duration_ms", 300);
    recordDistribution("chat.request.duration_ms", 180);

    const summary = getChatRuntimeSummary();

    expect(summary.requests.total).toBe(1);
    expect(summary.requests.success).toBe(1);
    expect(summary.requests.rateLimited).toBe(2);
    expect(summary.requests.serverErrors).toBe(1);
    expect(summary.requests.active).toBe(1);
    expect(summary.latencyMs.count).toBe(3);
    expect(summary.latencyMs.min).toBe(120);
    expect(summary.latencyMs.max).toBe(300);
    expect(summary.latencyMs.p95).toBe(300);
  });

  it("tracks usage metrics through counters and distributions", () => {
    incrementCounter("llm.usage.track.success", 2);
    incrementCounter("llm.usage.track.failure");
    incrementCounter("llm.usage.tokens.total", 900);
    incrementCounter("llm.usage.cost_usd.total", 0.42);
    recordDistribution("llm.usage.cost_usd.per_call", 0.1);
    recordDistribution("llm.usage.cost_usd.per_call", 0.32);

    const summary = getChatRuntimeSummary();
    const distribution = getDistributionSnapshot("llm.usage.cost_usd.per_call");

    expect(summary.usageTracking.successfulWrites).toBe(2);
    expect(summary.usageTracking.failedWrites).toBe(1);
    expect(summary.usageTracking.totalTokens).toBe(900);
    expect(summary.usageTracking.totalCostUsd).toBeCloseTo(0.42);
    expect(distribution.count).toBe(2);
    expect(distribution.max).toBe(0.32);
    expect(distribution.p50).toBe(0.1);
    expect(distribution.p95).toBe(0.32);
  });
});
