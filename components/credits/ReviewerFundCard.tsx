"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Coins, Trophy, Loader2, ArrowRight } from "lucide-react";

interface ReviewerFundCardProps {
  className?: string;
}

export default function ReviewerFundCard({ className }: ReviewerFundCardProps) {
  const earnings = useQuery(api.reviewerFund.getMyFundEarnings);

  if (!earnings) {
    return (
      <div className={`animate-pulse rounded-xl bg-card p-6 shadow-sm ${className ?? ""}`}>
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="mt-4 h-8 w-20 rounded bg-muted" />
      </div>
    );
  }

  if (!earnings.eligible) {
    return (
      <div className={`rounded-xl bg-card p-6 shadow-sm ${className ?? ""}`}>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          Reviewer Fund
        </h4>
        <div className="rounded-xl bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Complete {Math.max(0, 10 - (earnings.currentLevel > 0 ? earnings.currentLevel * 5 : 0))}+ quality reviews to earn from the Reviewer Fund.
          </p>
          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <span>Current: Level {earnings.currentLevel}</span>
            <ArrowRight className="h-3 w-3" />
            <span>Required: Level {earnings.requiredLevel}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-card p-6 shadow-sm ${className ?? ""}`}>
      <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-amber-500" />
        Reviewer Fund Earnings
      </h4>

      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5 fill-amber-400 text-amber-400" />
        <span className="text-2xl font-bold text-amber-400" aria-label={`Total earned: ${earnings.totalEarned} credits`}>
          {earnings.totalEarned.toLocaleString()}
        </span>
        <span className="text-sm text-muted-foreground">Credits earned</span>
      </div>

      {earnings.distributions.length > 0 ? (
        <div className="space-y-2" role="list" aria-label="Your fund distributions">
          {earnings.distributions.slice(0, 5).map((dist, i) => (
            <div
              key={`${dist.createdAt}-${i}`}
              role="listitem"
              className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
            >
              <div className="text-xs text-muted-foreground">
                Rank #{dist.rank} · Score {dist.qualityScore.toFixed(1)}
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-amber-400">
                <Coins className="h-3 w-3 fill-amber-400" />
                {dist.amount.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          You're eligible! Your share will appear after the next monthly distribution.
        </p>
      )}
    </div>
  );
}
