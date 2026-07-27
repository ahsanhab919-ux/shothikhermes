"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Globe,
  Store,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  BookOpen,
  TrendingUp,
  Zap,
  Library,
  RefreshCw,
  Send,
  Square,
  CheckSquare,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAvailableChannels, isPublishDriveEnabled } from "@/services/publishDriveService";
import { toast } from "react-toastify";

const CHANNEL_ICONS = {
  google_play: "🔵",
  amazon_kindle: "📦",
  apple_books: "🍎",
  kobo: "📖",
  barnes_noble: "📚",
  scribd: "📜",
  overdrive: "🏛️",
  bibliotheca: "📕",
  tolino: "📱",
  vivlio: "📗",
  dangdang: "🔴",
  "24symbols": "✨",
};

const CATEGORY_LABELS = {
  ebook: { label: "eBook Store", icon: Store, color: "text-blue-500" },
  subscription: { label: "Subscription", icon: TrendingUp, color: "text-purple-500" },
  library: { label: "Library Network", icon: Library, color: "text-amber-500" },
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    icon: Loader2,
    spin: true,
  },
  live: {
    label: "Live",
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    icon: XCircle,
  },
  removed: {
    label: "Removed",
    color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
    icon: XCircle,
  },
};

function ChannelCard({ channel, channelStatus, isEnabled, isSelected, onToggle, isSelectMode, onRetry, isRetrying }) {
  const status = isEnabled ? (channelStatus?.status || "pending") : "pending";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const categoryConfig = CATEGORY_LABELS[channel.category] || CATEGORY_LABELS.ebook;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-zinc-900/50 border rounded-xl p-4 transition-all",
        status === "live"
          ? "border-emerald-200 dark:border-emerald-800/30"
          : status === "failed"
          ? "border-red-200 dark:border-red-800/30"
          : "border-zinc-200 dark:border-zinc-800",
        isSelectMode && isEnabled && "cursor-pointer",
        isSelectMode && isSelected && isEnabled && "ring-2 ring-brand border-brand/30 bg-brand/5 dark:bg-brand/10"
      )}
      onClick={isSelectMode && isEnabled ? () => onToggle(channel.id) : undefined}
    >
      <div className="flex items-center gap-3">
        {isSelectMode && (
          <div className={cn("shrink-0", isEnabled ? "text-brand" : "text-zinc-300 dark:text-zinc-600")}>
            {isEnabled && isSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </div>
        )}
        <span className="text-2xl">{CHANNEL_ICONS[channel.id] || "📘"}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
            {channel.name}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-zinc-400">{channel.region}</span>
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">·</span>
            <span className={cn("text-[10px] font-bold", categoryConfig.color)}>
              {categoryConfig.label}
            </span>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0",
          isEnabled ? statusConfig.color : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
        )}>
          <StatusIcon className={cn("h-2.5 w-2.5", statusConfig.spin && "animate-spin")} />
          {isEnabled ? statusConfig.label : "Inactive"}
        </div>
      </div>
      {channelStatus?.url && status === "live" && (
        <a
          href={channelStatus.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-2 text-xs text-brand font-bold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
          View on {channel.name}
        </a>
      )}
      {status === "failed" && onRetry && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRetry(channel.id);
          }}
          disabled={isRetrying}
          className="flex items-center gap-1 mt-2 text-xs text-red-600 dark:text-red-400 font-bold hover:underline disabled:opacity-50"
        >
          {isRetrying ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Retry distribution
        </button>
      )}
    </motion.div>
  );
}

export function DistributionManager({ book }) {
  const enabled = isPublishDriveEnabled();
  const channels = getAvailableChannels();
  const [filter, setFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState(() => channels.map((ch) => ch.id));
  const [pollTick, setPollTick] = useState(0);

  const distRecord = useQuery(
    api.publishing.getDistributionRecord,
    book?._id ? { bookId: book._id, userId: book.userId } : "skip"
  );

  const channelStatusMap = {};
  if (distRecord?.channels) {
    for (const ch of distRecord.channels) {
      channelStatusMap[ch.channelId] = ch;
    }
  }

  const googlePlayStatus = {
    channelId: "google_play",
    status: book?.status === "published" || book?.googlePlayUrl ? "live" : "pending",
    url: book?.googlePlayUrl || undefined,
  };
  if (!channelStatusMap["google_play"]) {
    channelStatusMap["google_play"] = googlePlayStatus;
  }

  const liveCount = Object.values(channelStatusMap).filter((ch) => ch.status === "live").length;
  const processingCount = Object.values(channelStatusMap).filter((ch) => ch.status === "processing").length;

  useEffect(() => {
    if (processingCount === 0) return;
    const timer = setTimeout(() => setPollTick((n) => n + 1), 30000);
    return () => clearTimeout(timer);
  }, [processingCount, pollTick]);

  const [retryingChannel, setRetryingChannel] = useState(null);
  const failedCount = Object.values(channelStatusMap).filter((ch) => ch.status === "failed").length;

  const canDistribute =
    enabled &&
    book?.status &&
    ["approved", "published", "submitted"].includes(book.status) &&
    !distRecord;

  const canRetry =
    enabled &&
    book?.status &&
    ["approved", "published", "submitted"].includes(book.status) &&
    distRecord &&
    (distRecord.status === "failed" || failedCount > 0);

  const handleToggleChannel = useCallback((id) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleDistribute = useCallback(async () => {
    if (!book?._id || selectedChannels.length === 0) return;
    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || ""
        : "";
      const res = await fetch("/api/publish/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book._id, selectedChannels }),
      });

      const { trackBookPublished } = await import("@/lib/posthog");
      const data = await res.json();
      if (res.ok && data.success) {
        trackBookPublished();
        toast.success(data.message || "Distribution started!");
        setIsSelectMode(false);
      } else {
        toast.error(data.error || "Distribution failed. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }, [book, selectedChannels]);

  const handleRetry = useCallback(async (channelId) => {
    if (!book?._id) return;
    setRetryingChannel(channelId);
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token") || ""
        : "";
      const retryChannels = channelId ? [channelId] : undefined;
      const res = await fetch("/api/publish/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookId: book._id, selectedChannels: retryChannels, retry: true }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Retry submitted successfully!");
      } else {
        toast.error(data.error || "Retry failed. Please try again later.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setRetryingChannel(null);
    }
  }, [book]);

  const filteredChannels = channels.filter((ch) => {
    if (filter === "all") return true;
    return ch.category === filter;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{liveCount}</p>
          <p className="text-xs text-zinc-500">Live Stores</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{processingCount}</p>
          <p className="text-xs text-zinc-500">Processing</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-zinc-600 dark:text-zinc-300">{channels.length}</p>
          <p className="text-xs text-zinc-500">Available</p>
        </div>
      </div>

      {processingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4 flex items-center gap-3"
        >
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Distribution in progress</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              Processing at {processingCount} store{processingCount > 1 ? "s" : ""}. This may take up to 72 hours.
            </p>
          </div>
          <button
            onClick={() => setPollTick((n) => n + 1)}
            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-400 transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {failedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4 flex items-center gap-3"
        >
          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Distribution failed</p>
            <p className="text-xs text-red-600 dark:text-red-500">
              {failedCount} channel{failedCount > 1 ? "s" : ""} failed. You can retry individual channels or all failed channels at once.
            </p>
          </div>
          {canRetry && (
            <button
              onClick={() => handleRetry(null)}
              disabled={retryingChannel !== null}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {retryingChannel !== null ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry All
            </button>
          )}
        </motion.div>
      )}

      {enabled ? (
        canDistribute && (
          <div className="bg-gradient-to-r from-brand/5 to-purple-50 dark:from-brand/10 dark:to-purple-900/10 border border-brand/20 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="size-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                  Ready to distribute to 400+ stores
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  Distribute to Amazon Kindle, Apple Books, Kobo, Barnes & Noble, and 240,000+ libraries worldwide.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsSelectMode(!isSelectMode)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                      isSelectMode
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-brand/40"
                    )}
                  >
                    {isSelectMode ? "Cancel" : "Choose Stores"}
                  </button>
                  <button
                    onClick={handleDistribute}
                    disabled={isSubmitting || selectedChannels.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Distribute to {selectedChannels.length} Stores
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="size-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                Expand to 400+ Stores
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your books are currently published to Google Play Books. Activate multi-store distribution
                to reach Amazon Kindle, Apple Books, Kobo, Barnes & Noble, and 240,000+ libraries worldwide.
                Contact support to enable full distribution.
              </p>
            </div>
          </div>
        </div>
      )}

      {isSelectMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center gap-2 text-xs"
        >
          <span className="text-zinc-500 font-medium">{selectedChannels.length} selected</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button
            onClick={() => setSelectedChannels(channels.map((ch) => ch.id))}
            className="text-brand font-bold hover:underline"
          >
            Select all
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <button
            onClick={() => setSelectedChannels([])}
            className="text-zinc-500 hover:text-zinc-700 hover:underline"
          >
            Clear
          </button>
        </motion.div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { id: "all", label: "All Channels" },
          { id: "ebook", label: "eBook Stores" },
          { id: "subscription", label: "Subscription" },
          { id: "library", label: "Libraries" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              filter === f.id
                ? "bg-brand text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredChannels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            channelStatus={channelStatusMap[channel.id]}
            isEnabled={enabled || channel.id === "google_play"}
            isSelected={selectedChannels.includes(channel.id)}
            onToggle={handleToggleChannel}
            isSelectMode={isSelectMode}
            onRetry={canRetry ? handleRetry : undefined}
            isRetrying={retryingChannel === channel.id}
          />
        ))}
      </div>

      {distRecord && (
        <p className="text-center text-xs text-zinc-400">
          Last updated {new Date(distRecord.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
