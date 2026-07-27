"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; spin?: boolean }> = {
  pending: { label: "Pending", color: "text-zinc-500" },
  processing: { label: "Processing", color: "text-blue-500", spin: true },
  review: { label: "In Review", color: "text-amber-500" },
  in_review: { label: "In Review", color: "text-amber-500" },
  live: { label: "Live", color: "text-emerald-500" },
  completed: { label: "Live", color: "text-emerald-500" },
  failed: { label: "Failed", color: "text-red-500" },
  removed: { label: "Removed", color: "text-zinc-400" },
};

function StatusIcon({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  if (status === "live" || status === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  if (status === "processing") return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
  if (status === "review" || status === "in_review") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  return <Clock className="h-3.5 w-3.5 text-zinc-400" />;
}

export function DistributionStatusPanel({ bookId, userId }: { bookId: string; userId: string }) {
  const distRecord = useQuery(api.publishing.getDistributionRecord, { bookId });
  const [retrying, setRetrying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localChannels, setLocalChannels] = useState<any[] | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
      const res = await fetch("/api/publish/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId, retry: true }),
      });
      await res.json();
    } catch {
    } finally {
      setRetrying(false);
    }
  }, [bookId]);

  const handleRefreshStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";
      const res = await fetch(`/api/publish/status?bookId=${encodeURIComponent(bookId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.channels) {
          setLocalChannels(data.channels);
          setLastRefreshedAt(data.updatedAt || Date.now());
        }
      }
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, [bookId]);

  if (!distRecord) return null;

  const channels = localChannels || distRecord.channels || [];
  const liveCount = channels.filter((ch: any) => ch.status === "live").length;
  const failedCount = channels.filter((ch: any) => ch.status === "failed").length;
  const processingCount = channels.filter((ch: any) => ch.status === "processing").length;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Globe className="h-5 w-5 text-brand" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-foreground">Distribution Status</h3>
          <p className="text-xs text-muted-foreground">
            {liveCount > 0 && `${liveCount} live`}
            {processingCount > 0 && `${liveCount > 0 ? ", " : ""}${processingCount} processing`}
            {failedCount > 0 && `${liveCount + processingCount > 0 ? ", " : ""}${failedCount} failed`}
            {liveCount + processingCount + failedCount === 0 && "No channels submitted"}
          </p>
        </div>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          title="Refresh status from PublishDrive"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
        </button>
        {failedCount > 0 && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 border border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-50 transition-colors"
          >
            {retrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Retry
          </button>
        )}
      </div>
      <div className="divide-y divide-border">
        {channels.map((ch: any) => (
          <div key={ch.channelId} className="flex items-center gap-3 px-4 py-2.5">
            <StatusIcon status={ch.status} />
            <span className="flex-1 text-sm text-foreground truncate">{ch.channelName}</span>
            <span className={`text-xs font-medium ${(STATUS_CONFIG[ch.status] || STATUS_CONFIG.pending).color}`}>
              {(STATUS_CONFIG[ch.status] || STATUS_CONFIG.pending).label}
            </span>
            {ch.url && ch.status === "live" && (
              <a
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:text-brand/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
      <div className="px-4 py-2 text-center text-[10px] text-muted-foreground border-t border-border">
        Last updated {new Date(lastRefreshedAt || distRecord.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
