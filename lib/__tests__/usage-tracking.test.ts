import { describe, expect, it, vi } from 'vitest';
import { trackUsageSafe } from '../usage-tracking';
import { getChatRuntimeSummary, resetMetrics } from '../runtime-metrics';

vi.mock('@/convex/_generated/api', () => ({
  api: {
    llmUsage: {
      trackUsage: 'llmUsage.trackUsage',
    },
  },
}));

describe('trackUsageSafe', () => {
  it('records runtime usage metrics after a successful write', async () => {
    resetMetrics();

    const convex = {
      mutation: vi.fn(),
    };

    const payload = {
      userId: 'u1',
      tool: 'grammar',
      provider: 'test',
      tokens: 10,
      inputTokens: 5,
      outputTokens: 5,
      costUsd: 0.01,
    };

    await trackUsageSafe(convex as any, payload);

    const summary = getChatRuntimeSummary();

    expect(summary.usageTracking.successfulWrites).toBe(1);
    expect(summary.usageTracking.failedWrites).toBe(0);
    expect(summary.usageTracking.totalTokens).toBe(10);
    expect(summary.usageTracking.totalCostUsd).toBeCloseTo(0.01);
    expect(summary.usageTracking.perCall.count).toBe(1);
  });

  it('calls the llmUsage.trackUsage mutation', async () => {
    const convex = {
      mutation: vi.fn(),
    };

    const payload = {
      userId: 'u1',
      tool: 'grammar',
      provider: 'test',
      tokens: 10,
      inputTokens: 5,
      outputTokens: 5,
      costUsd: 0.01,
    };

    await expect(trackUsageSafe(convex as any, payload)).resolves.toBeUndefined();

    expect(convex.mutation).toHaveBeenCalledTimes(1);
    expect(convex.mutation).toHaveBeenCalledWith('llmUsage.trackUsage', payload);
  });
});
