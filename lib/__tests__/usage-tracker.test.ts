import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ToolName } from '@/lib/ai-gateway';

vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../runtime-metrics', () => ({
  incrementCounter: vi.fn(),
  setGauge: vi.fn(),
}));

import {
  checkUsageLimit,
  recordUsage,
  getUserUsageSummary,
  clearUsage,
  getToolLimits,
} from '../usage-tracker';

describe('usage-tracker', () => {
  beforeEach(() => {
    clearUsage('test-user');
  });

  describe('checkUsageLimit', () => {
    it('allows usage when under limit', () => {
      const result = checkUsageLimit('test-user', 'paraphrase', 'free');
      expect(result.allowed).toBe(true);
      expect(result.hourlyUsed).toBe(0);
      expect(result.dailyUsed).toBe(0);
    });

    it('blocks when hourly limit reached', () => {
      for (let i = 0; i < 10; i++) {
        recordUsage('test-user', 'paraphrase', { inputChars: 100, cached: false, latencyMs: 50 });
      }

      const result = checkUsageLimit('test-user', 'paraphrase', 'free');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Hourly limit');
    });

    it('returns unlimited for unknown tool config', () => {
      const unknownTool = 'unknown_tool' as ToolName;
      const result = checkUsageLimit('test-user', unknownTool, 'free');
      expect(result.allowed).toBe(true);
      expect(result.hourlyLimit).toBe(Infinity);
    });
  });

  describe('recordUsage', () => {
    it('records usage and increments count', () => {
      recordUsage('test-user', 'grammar', { inputChars: 500, cached: false, latencyMs: 100 });

      const result = checkUsageLimit('test-user', 'grammar', 'free');
      expect(result.hourlyUsed).toBe(1);
      expect(result.dailyUsed).toBe(1);
    });
  });

  describe('getUserUsageSummary', () => {
    it('returns summary for all tools', () => {
      recordUsage('test-user', 'paraphrase', { inputChars: 100, cached: false, latencyMs: 50 });

      const summary = getUserUsageSummary('test-user');
      expect(summary.paraphrase.hourly).toBe(1);
      expect(summary.paraphrase.daily).toBe(1);
      expect(summary.grammar.hourly).toBe(0);
    });
  });

  describe('clearUsage', () => {
    it('clears usage for a specific tool', () => {
      recordUsage('test-user', 'paraphrase', { inputChars: 100, cached: false, latencyMs: 50 });
      clearUsage('test-user', 'paraphrase');

      const result = checkUsageLimit('test-user', 'paraphrase', 'free');
      expect(result.hourlyUsed).toBe(0);
    });

    it('clears all usage for a user', () => {
      recordUsage('test-user', 'paraphrase', { inputChars: 100, cached: false, latencyMs: 50 });
      recordUsage('test-user', 'grammar', { inputChars: 100, cached: false, latencyMs: 50 });
      clearUsage('test-user');

      const summary = getUserUsageSummary('test-user');
      expect(summary.paraphrase.hourly).toBe(0);
      expect(summary.grammar.hourly).toBe(0);
    });
  });

  describe('getToolLimits', () => {
    it('returns limits for a valid tool and tier', () => {
      const limits = getToolLimits('paraphrase', 'free');
      expect(limits).toEqual({ perHour: 10, perDay: 50 });
    });

    it('returns limits for pro tier', () => {
      const limits = getToolLimits('paraphrase', 'pro');
      expect(limits).toEqual({ perHour: 100, perDay: 1000 });
    });

    it('returns undefined for unknown tool', () => {
      const unknownTool = 'unknown' as ToolName;
      const limits = getToolLimits(unknownTool, 'free');
      expect(limits).toBeUndefined();
    });
  });
});
