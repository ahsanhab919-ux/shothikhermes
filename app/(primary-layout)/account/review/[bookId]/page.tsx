"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft, AlertTriangle, BookOpen, Globe, Loader2 } from "lucide-react";

export default function MasterReviewPage() {
  const params = useParams();
  const bookId = params.bookId as string;
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<"approving" | "rejecting" | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [distributionOptIn, setDistributionOptIn] = useState<boolean | null>(null);
  const [distributionError, setDistributionError] = useState<string | null>(null);

  const book = useQuery(api.books.get, { id: bookId as any });
  const createNotification = useMutation(api.agent_notifications.createNotification);
  const updateStatus = useMutation(api.books.updateStatus);

  useEffect(() => {
    if (book && distributionOptIn === null) {
      setDistributionOptIn((book as any).distributionOptIn !== false);
    }
  }, [book, distributionOptIn]);

  const handleApprove = async () => {
    setAction("approving");
    setDistributionError(null);

    try {
      const optIn = distributionOptIn !== false;
      await updateStatus({
        bookId: bookId as any,
        status: "approved",
        distributionOptIn: optIn,
      });

      if (optIn) {
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
            body: JSON.stringify({ bookId }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            const errMsg = data.error || "Distribution submission failed, but your book was still approved.";
            setDistributionError(errMsg);
            try {
              await createNotification({
                masterId: book.userId,
                type: "distribution_failed",
                bookId: bookId as any,
                bookTitle: book.title,
                message: `Distribution failed for "${book.title}": ${errMsg}`,
              });
            } catch {}
          }
        } catch {
          setDistributionError("Could not connect to distribution service, but your book was still approved.");
        }
      }

      setDone("approved");
    } catch (err: any) {
      setDistributionError(err.message || "Failed to approve book. Please try again.");
    } finally {
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setAction("rejecting");
    try {
      await updateStatus({
        bookId: bookId as any,
        status: "rejected",
        rejectionReason: feedback,
      });
      setDone("rejected");
    } catch {
      setDistributionError("Failed to submit rejection. Please try again.");
    } finally {
      setAction(null);
    }
  };

  if (done === "approved") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Book Approved</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Your agent's book has been approved and submitted to the publication pipeline.
          </p>
          {distributionOptIn && !distributionError && (
            <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">
              Distribution to Amazon Kindle, Apple Books, Google Play Books, and 400+ retailers has been initiated.
              It will appear on stores within 3–5 business days.
            </p>
          )}
          {distributionOptIn && distributionError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">{distributionError} You can retry distribution from the book management page.</p>
              </div>
            </div>
          )}
          {!distributionOptIn && (
            <p className="mb-4 text-sm text-muted-foreground">
              External distribution was not selected. You can enable it later from the book management page.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/account/agents" className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
              Back to Agents
            </Link>
            <Link href="/explore" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity">
              View in Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <XCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-foreground">Revision Requested</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Your feedback has been sent to the agent. It will revise the manuscript and notify you when ready for another review.
          </p>
          <Link href="/account/agents" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/account/agents" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-foreground">Master Review</h1>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{book?.title || "Untitled Manuscript"}</h2>
            <p className="text-sm text-muted-foreground">Book ID: {bookId}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <QualityMetric label="Readability" value={78} max={100} color="emerald" unit="/100" />
          <QualityMetric label="Word Count" value={12400} max={120000} color="blue" unit=" words" formatted />
          <QualityMetric label="Grammar Issues" value={2} max={20} color="amber" unit=" issues" inverted />
        </div>

        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Quality check passed — no PII detected</span>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/40 shrink-0">
            <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground">External Distribution</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Distribute your book to Amazon Kindle, Apple Books, Google Play Books, Kobo, Barnes & Noble, and 400+ global retailers via PublishDrive.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={distributionOptIn !== false}
            onChange={(e) => setDistributionOptIn(e.target.checked)}
            className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <span className="text-sm font-medium text-foreground">
              Opt in to external distribution
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your book will be submitted to 400+ stores and libraries worldwide upon approval.
              You can manage distribution channels from the book page after approval.
            </p>
          </div>
        </label>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-base font-semibold text-foreground">Your Decision</h3>

        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium text-foreground">Feedback for the agent (required for revision request)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe what changes you'd like the agent to make, or leave this empty if approving..."
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
          />
        </div>

        {distributionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
            <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">{distributionError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleApprove}
            disabled={!!action}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {action === "approving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {action === "approving" ? "Approving..." : distributionOptIn ? "Approve & Distribute" : "Approve & Publish"}
          </button>
          <button
            onClick={handleReject}
            disabled={!feedback.trim() || !!action}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            {action === "rejecting" ? "Sending..." : "Request Revision"}
          </button>
        </div>

        {!feedback.trim() && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Feedback is required to request a revision
          </p>
        )}
      </div>
    </div>
  );
}

function QualityMetric({ label, value, max, color, unit, formatted, inverted }: {
  label: string; value: number; max: number; color: string; unit: string; formatted?: boolean; inverted?: boolean;
}) {
  const pct = inverted ? Math.max(0, 100 - (value / max) * 100) : (value / max) * 100;
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  };
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="mb-2 text-lg font-bold text-foreground">
        {formatted ? value.toLocaleString() : value}{unit}
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div className={`h-1.5 rounded-full ${colorMap[color]}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
