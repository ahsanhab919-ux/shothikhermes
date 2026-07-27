import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/runtime-metrics', () => ({
  getMetricsSnapshot: vi.fn(() => ({ counters: {}, gauges: {} })),
  getChatRuntimeSummary: vi.fn(() => ({
    requests: {
      total: 0,
      success: 0,
      rateLimited: 0,
      unauthorized: 0,
      validationFailed: 0,
      serverErrors: 0,
      active: 0,
    },
    latencyMs: {
      count: 0,
      sum: 0,
      min: null,
      max: null,
      avg: null,
      p50: null,
      p95: null,
      p99: null,
      lastUpdated: 0,
    },
    usageTracking: {
      successfulWrites: 0,
      failedWrites: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      perCall: {
        count: 0,
        sum: 0,
        min: null,
        max: null,
        avg: null,
        p50: null,
        p95: null,
        p99: null,
        lastUpdated: 0,
      },
    },
    generatedAt: '2026-07-25T00:00:00.000Z',
  })),
}));

vi.mock('@/lib/result-cache', () => ({
  getCacheStats: vi.fn(() => ({})),
  computeContentHash: vi.fn(),
  getCachedResult: vi.fn(),
  setCachedResult: vi.fn(),
}));

vi.mock('@/lib/ai-gateway', () => ({
  getAllCircuitStatuses: vi.fn(() => ({})),
}));

vi.mock('@/lib/convex/auth-diagnostics', () => ({
  diagnoseConvexJwtConfig: vi.fn(() => ({
    status: 'healthy',
    message: 'Convex JWT keypair matches the configured public key.',
  })),
}));

import { GET } from '../../health/route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns basic health check', async () => {
    const req = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(req);
    const data = await response.json();

    expect(data.status).toBe('ok');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
  });

  it('returns deep health check when deep=true', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    );

    const req = new NextRequest('http://localhost:3000/api/health?deep=true');
    const response = await GET(req);
    const data = await response.json();

    expect(data).toHaveProperty('checks');
    expect(data.checks).toHaveProperty('convex:auth');
    expect(data).toHaveProperty('services');
    expect(data).toHaveProperty('timestamp');
  });

  it('returns metrics when metrics=true in development', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';

    const req = new NextRequest('http://localhost:3000/api/health?metrics=true');
    const response = await GET(req);
    const data = await response.json();

    expect(data).toHaveProperty('metrics');
    expect(data).toHaveProperty('chatRuntime');
    expect(data).toHaveProperty('caches');
    expect(data).toHaveProperty('circuits');

    (process.env as any).NODE_ENV = originalEnv;
    (process.env as any).NODE_ENV = originalEnv;
  });
});
