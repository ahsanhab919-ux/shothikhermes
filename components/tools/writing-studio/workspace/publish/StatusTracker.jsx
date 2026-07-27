"use client";

import { useMemo } from "react";
import {
  FileText,
  Send,
  Search,
  CheckCircle2,
  Upload,
  Globe,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const STATUSES = [
  {
    id: "draft",
    label: "Draft",
    icon: FileText,
    color: "slate",
    description: "Book details saved as draft",
  },
  {
    id: "submitted",
    label: "Submitted",
    icon: Send,
    color: "blue",
    description: "Submitted for review",
  },
  {
    id: "in_review",
    label: "In Review",
    icon: Search,
    color: "amber",
    description: "Being reviewed by our team",
  },
  {
    id: "approved",
    label: "Approved",
    icon: CheckCircle2,
    color: "emerald",
    description: "Approved for publication",
  },
  {
    id: "uploading",
    label: "Publishing",
    icon: Upload,
    color: "purple",
    description: "Being uploaded to stores",
  },
  {
    id: "published",
    label: "Live",
    icon: Globe,
    color: "emerald",
    description: "Available for purchase",
  },
];

const COLOR_MAP = {
  slate: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-400",
    border: "border-zinc-300 dark:border-zinc-700",
    fill: "bg-zinc-300 dark:bg-zinc-600",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-500",
    border: "border-blue-300 dark:border-blue-700",
    fill: "bg-blue-500",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-500",
    border: "border-amber-300 dark:border-amber-700",
    fill: "bg-amber-500",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/20",
    text: "text-emerald-500",
    border: "border-emerald-300 dark:border-emerald-700",
    fill: "bg-emerald-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-500",
    border: "border-purple-300 dark:border-purple-700",
    fill: "bg-purple-500",
  },
};

export function StatusTracker({
  book = null,
  onResubmit,
}) {
  const currentStatus = book?.status || "submitted";
  const isRejected = currentStatus === "rejected";

  const statusTimeline = useMemo(() => {
    const statusOrder = STATUSES.map((s) => s.id);
    const currentIndex = isRejected
      ? statusOrder.indexOf("in_review")
      : statusOrder.indexOf(currentStatus);

    return STATUSES.map((status, index) => ({
      ...status,
      state:
        index < currentIndex ? "completed" :
        index === currentIndex && !isRejected ? "active" :
        "pending",
    }));
  }, [currentStatus, isRejected]);

  const timestamps = book?.timestamps || {
    submitted: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">
            Publishing Progress
          </h3>
          <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-brand transition-colors">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        <div className="relative">
          {statusTimeline.map((status, index) => {
            const Icon = status.icon;
            const colors = COLOR_MAP[status.color];
            const isLast = index === statusTimeline.length - 1;
            const timestamp = timestamps[status.id];

            return (
              <div key={status.id} className="flex items-start gap-4 relative">
                {!isLast && (
                  <div className="absolute left-5 top-10 bottom-0 w-0.5">
                    <div
                      className={cn(
                        "w-full h-full transition-colors duration-500",
                        status.state === "completed" ? "bg-emerald-400" : "bg-zinc-200 dark:bg-zinc-700"
                      )}
                    />
                  </div>
                )}

                <div className="relative z-10">
                  <div
                    className={cn(
                      "size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      status.state === "completed" && "bg-emerald-500 border-emerald-500 text-white",
                      status.state === "active" && cn(colors.bg, colors.text, colors.border, "shadow-lg"),
                      status.state === "pending" && "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600"
                    )}
                  >
                    {status.state === "completed" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : status.state === "active" ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                </div>

                <div className={cn("flex-1 pb-8", isLast && "pb-0")}>
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "font-bold text-sm transition-colors",
                        status.state === "active" && "text-zinc-900 dark:text-white",
                        status.state === "completed" && "text-emerald-600 dark:text-emerald-400",
                        status.state === "pending" && "text-zinc-400"
                      )}
                    >
                      {status.label}
                    </p>
                    {status.state === "active" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-bold animate-pulse">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{status.description}</p>
                  {timestamp && (
                    <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(timestamp).toLocaleString()}
                    </p>
                  )}
                  {status.id === "published" && status.state === "completed" && book?.googlePlayUrl && (
                    <a
                      href={book.googlePlayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand font-bold hover:underline"
                    >
                      View on Google Play <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="size-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-red-700 dark:text-red-400">
                  Submission Needs Changes
                </h3>
                {book?.rejectionCategory && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold capitalize">
                    {book.rejectionCategory.replace(/_/g, " ")}
                  </span>
                )}
                {book?.resubmissionCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
                    Attempt {book.resubmissionCount + 1}
                  </span>
                )}
              </div>
              <p className="text-sm text-red-600 dark:text-red-300 mb-3">
                {book?.rejectionReason || "Your submission requires revisions. Please review the feedback and resubmit."}
              </p>
              {book?.reviewNotes && (
                <div className="bg-white/60 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-lg p-3 mb-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Reviewer Notes</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{book.reviewNotes}</p>
                </div>
              )}
              {book?.rejectionCategory && (
                <div className="bg-white/60 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-lg p-3 mb-4">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">What to fix</p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {book.rejectionCategory === "content_quality" && "Improve your manuscript quality — check grammar, structure, and overall writing."}
                    {book.rejectionCategory === "formatting" && "Fix formatting issues in your manuscript file. Re-upload a clean EPUB or PDF."}
                    {book.rejectionCategory === "cover_quality" && "Upload a higher quality cover image (min 1600x2400px) with professional design."}
                    {book.rejectionCategory === "metadata" && "Update your book details — title, description, keywords, or category need work."}
                    {book.rejectionCategory === "copyright" && "Resolve copyright concerns. Ensure all content is original or properly licensed."}
                    {book.rejectionCategory === "policy_violation" && "Review our content guidelines and remove any policy-violating content."}
                    {book.rejectionCategory === "other" && "Address the specific feedback provided above."}
                  </p>
                </div>
              )}
              {book?.previousRejections?.length > 0 && (
                <details className="mb-4">
                  <summary className="text-[10px] font-bold text-red-400 uppercase tracking-wider cursor-pointer hover:text-red-600 transition-colors">
                    Previous rejections ({book.previousRejections.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {book.previousRejections.map((rej, i) => (
                      <div key={i} className="bg-white/40 dark:bg-red-900/5 border border-red-100 dark:border-red-800/10 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/20 text-red-500 font-bold capitalize">
                            {rej.category.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-red-400">
                            {new Date(rej.rejectedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-300">{rej.reason}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <button
                onClick={onResubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-brand/20"
              >
                Edit & Resubmit
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {book?.reviewedBy && (
        <div className="bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-start gap-3">
          <Search className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
              Reviewed by {book.reviewedBy}
            </p>
            {book.reviewedAt && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {new Date(book.reviewedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {currentStatus === "in_review" && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Review in Progress</p>
            <p className="text-xs text-amber-600 dark:text-amber-300">
              Our team is reviewing your submission. This typically takes 48-72 hours. We'll notify you by email when there's an update.
            </p>
          </div>
        </div>
      )}

      {currentStatus === "published" && (
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl p-4 flex items-start gap-3">
          <Globe className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Your Book is Live!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              Congratulations! Your book is now available for purchase on Google Play Books. Sales data will appear in your earnings dashboard within a few days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
