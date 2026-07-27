'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function CostsDashboard() {
  const { user } = useSelector((state: any) => state.auth);
  const isLoaded = user !== undefined;
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data: { isAdmin: boolean }) => setIsAdmin(data.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  const shouldLoad = isAdmin === true;
  const total = useQuery(api.llmUsage.getTotalSpend, shouldLoad ? { daysBack } : 'skip') as
    | { totalCostUsd: number; totalTokens: number; totalCalls: number }
    | undefined;
  const byTool = useQuery(api.llmUsage.getSpendByTool, shouldLoad ? { daysBack } : 'skip') as
    | Record<string, { tokens: number; costUsd: number; calls: number }>
    | undefined;
  const byUser = useQuery(api.llmUsage.getSpendByUser, shouldLoad ? { daysBack, limit: 15 } : 'skip') as
    | Array<{ userId: string; tokens: number; costUsd: number; calls: number }>
    | undefined;
  const byDay = useQuery(api.llmUsage.getDailySpend, shouldLoad ? { daysBack } : 'skip') as
    | Record<string, { tokens: number; costUsd: number; calls: number }>
    | undefined;

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin w-6 h-6 border-2 border-zinc-600 border-t-brand rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 text-sm">Access restricted to administrators.</p>
        </div>
      </div>
    );
  }

  const toolEntries = Object.entries(byTool ?? {}).sort((a, b) => b[1].costUsd - a[1].costUsd);
  const totalCost = total?.totalCostUsd ?? 0;
  const dayEntries = Object.entries(byDay ?? {}).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDayCost = Math.max(...dayEntries.map(([, v]) => v.costUsd), 0.0001);

  return (
    <ErrorBoundary fallback={<AdminCostsFallback />}>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">LLM Cost Dashboard</h1>
              <p className="text-zinc-400 text-sm mt-1">Real-time spend tracking across all AI tools</p>
            </div>
            <div className="flex gap-2">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDaysBack(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    daysBack === d
                      ? 'bg-brand text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label={`Total Cost (${daysBack}d)`}
              value={total ? `$${total.totalCostUsd.toFixed(4)}` : '—'}
              sub={total ? `${formatTokens(total.totalTokens)} tokens` : ''}
            />
            <StatCard
              label="Total API Calls"
              value={total ? total.totalCalls.toLocaleString() : '—'}
              sub={total && total.totalCalls > 0 ? `avg $${(total.totalCostUsd / total.totalCalls).toFixed(4)}/call` : ''}
            />
            <StatCard
              label="Daily Average"
              value={total ? `$${(total.totalCostUsd / daysBack).toFixed(4)}` : '—'}
              sub="per day"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide">Spend by Tool</h2>
              {toolEntries.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No data for this period</p>
              ) : (
                <div className="space-y-3">
                  {toolEntries.map(([tool, stats]) => {
                    const pct = totalCost > 0 ? (stats.costUsd / totalCost) * 100 : 0;
                    return (
                      <div key={tool}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-500" />
                            <span className="text-xs font-medium text-zinc-300 capitalize">{tool}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <span>{stats.calls.toLocaleString()} calls</span>
                            <span className="font-bold text-zinc-200">${stats.costUsd.toFixed(4)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-zinc-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h2 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide">Daily Spend</h2>
              {dayEntries.length === 0 ? (
                <p className="text-zinc-500 text-xs py-4 text-center">No data for this period</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {dayEntries.map(([day, stats]) => {
                    const h = Math.round((stats.costUsd / maxDayCost) * 100);
                    const label = day.slice(5);
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: $${stats.costUsd.toFixed(4)}`}>
                        <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                          <div
                            className="w-full bg-brand/70 hover:bg-brand rounded-t-sm transition-colors"
                            style={{ height: `${Math.max(2, h)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-zinc-600">{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function AdminCostsFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center space-y-2">
        <p className="text-white font-bold">Failed to load costs dashboard</p>
        <p className="text-zinc-400 text-sm">Try refreshing the page. If the issue persists, check Convex connectivity and admin permissions.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}
