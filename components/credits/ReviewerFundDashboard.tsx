"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, Trophy, Users, Calendar, TrendingUp, Loader2 } from "lucide-react";

export default function ReviewerFundDashboard() {
  const poolStatus = useQuery(api.reviewerFund.getPoolStatus);
  const eligibleReviewers = useQuery(api.reviewerFund.getEligibleReviewers, { limit: 20 });
  const distributionHistory = useQuery(api.reviewerFund.getDistributionHistory, { limit: 10 });

  if (!poolStatus) {
    return (
      <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 rounded-xl bg-card p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading fund data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Coins className="h-4 w-4 fill-amber-400 text-amber-400" />
            Current Pool
          </div>
          <div className="text-2xl font-bold text-amber-400" aria-label={`Current pool: ${poolStatus.balance} credits`}>
            {poolStatus.balance.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Credits available</div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Total Accumulated
          </div>
          <div className="text-2xl font-bold text-foreground">
            {poolStatus.totalAccumulated.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{(poolStatus.fundRate * 100).toFixed(0)}% of platform fees</div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="h-4 w-4 text-amber-500" />
            Total Distributed
          </div>
          <div className="text-2xl font-bold text-foreground">
            {poolStatus.totalDistributed.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{poolStatus.distributionCount} distribution{poolStatus.distributionCount !== 1 ? "s" : ""}</div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Last Distribution
          </div>
          <div className="text-2xl font-bold text-foreground">
            {poolStatus.lastDistributionAt
              ? new Date(poolStatus.lastDistributionAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {poolStatus.lastDistributionAt
              ? new Date(poolStatus.lastDistributionAt).getFullYear()
              : "No distributions yet"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Users className="h-5 w-5 text-muted-foreground" />
            Eligible Reviewers
          </h3>

          {!eligibleReviewers ? (
            <div role="status" aria-live="polite" className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          ) : eligibleReviewers.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-6 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No eligible reviewers yet. Reviewers need Level 2+ to qualify.
              </p>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label="Eligible reviewers">
              {eligibleReviewers.map((reviewer) => (
                <div
                  key={reviewer.userId}
                  role="listitem"
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {reviewer.rank}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">
                        Reviewer {reviewer.userId.slice(-6)}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Lv.{reviewer.level}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{reviewer.reviewCount} reviews</span>
                      <span>Score: {reviewer.weightedScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-amber-400">
                      {reviewer.sharePercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{Math.floor((reviewer.sharePercent / 100) * poolStatus.balance)} Credits
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Distribution History
          </h3>

          {!distributionHistory ? (
            <div role="status" aria-live="polite" className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading…</span>
            </div>
          ) : distributionHistory.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-6 text-center">
              <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No distributions yet. The first monthly distribution will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label="Distribution history">
              {distributionHistory.map((dist) => (
                <div
                  key={dist.periodLabel}
                  role="listitem"
                  className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{dist.periodLabel}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {dist.recipientCount} reviewer{dist.recipientCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
                    <Coins className="h-3.5 w-3.5 fill-amber-400" />
                    {dist.totalDistributed.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
