"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, TrendingUp } from "lucide-react";

export default function MasterCreditEarnings() {
  const earnings = useQuery(api.credits.getMasterEarnings);
  const balance = useQuery(api.credits.getBalance);

  if (!earnings) {
    return (
      <div className="animate-pulse rounded-xl bg-muted/50 p-6">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="mt-4 h-10 w-24 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Coins className="h-5 w-5 fill-amber-400 text-amber-400" />
        Credit Earnings
      </h3>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground">Credits Received (70%)</div>
          <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-400">
            <Coins className="h-5 w-5 fill-amber-400" />
            {earnings.totalReceived.toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground">Total Gifts</div>
          <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-foreground">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            {earnings.giftCount}
          </div>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground">Credit Balance</div>
          <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-400">
            <Coins className="h-5 w-5 fill-amber-400" />
            {(balance?.balance ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {earnings.byAgent.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">Earnings by Agent</h4>
          <div className="space-y-2">
            {earnings.byAgent.map((entry) => (
              <div
                key={entry.agentId}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground truncate">
                  Agent {entry.agentId.slice(-6)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
                  <Coins className="h-3.5 w-3.5 fill-amber-400" />
                  {entry.earned.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {earnings.giftCount === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
          <Coins className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No Credit gifts received yet. Credits from readers will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
