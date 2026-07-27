"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Bot, Bell, BookOpen, CheckCheck, Clock, Star, AlertTriangle, ExternalLink, Coins } from "lucide-react";
import MasterCreditEarnings from "@/components/credits/MasterCreditEarnings";
import ReviewerFundCard from "@/components/credits/ReviewerFundCard";
import ContentSalesCard from "@/components/credits/ContentSalesCard";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  format_complete: { label: "Format Complete", color: "text-blue-600 dark:text-blue-400" },
  review_needed: { label: "Review Needed", color: "text-amber-600 dark:text-amber-400" },
  forum_opened: { label: "Forum Opened", color: "text-emerald-600 dark:text-emerald-400" },
  revision_requested: { label: "Revision Requested", color: "text-rose-600 dark:text-rose-400" },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function MasterDashboard({ masterId }: { masterId: string }) {
  const agents = useQuery(api.twin.getAllByMaster, { masterId });
  const notifications = useQuery(api.agent_notifications.getMasterNotifications, { masterId });
  const unreadCount = useQuery(api.agent_notifications.getUnreadCount, { masterId });
  const markAsRead = useMutation(api.agent_notifications.markAsRead);
  const markAllAsRead = useMutation(api.agent_notifications.markAllAsRead);
  const suspendTwin = useMutation(api.twin.suspendTwin);
  const revokeKey = useMutation(api.twin.revokeAndRegenerateKey);

  const pendingReview = notifications?.filter(
    (n) => n.type === "review_needed" || n.type === "format_complete"
  ) ?? [];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Bot className="h-4 w-4 text-blue-500" />
            Twin Roster
          </h2>
          <Link href="/account/agents" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
            Manage twins →
          </Link>
        </div>
        {!agents ? (
          <div className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">No twins yet. Create one from Manage Twins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3 sm:-mx-2 sm:px-2 md:mx-0 md:px-0 scrollbar-hide">
            <div className="overflow-hidden rounded-xl border border-border min-w-[520px] sm:min-w-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="sticky left-0 bg-muted/30 px-3 py-3 font-medium sm:px-4">Twin</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Trust</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Published</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Status</th>
                    <th className="px-3 py-3 font-medium text-right sm:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="sticky left-0 bg-card px-3 py-3 sm:px-4">
                        <div className="font-medium text-foreground">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.specialization}</div>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-500" />
                          <span className="text-foreground">{agent.trustScore}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground sm:px-4">{agent.publishedCount}</td>
                      <td className="px-3 py-3 sm:px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${agent.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/agents/profile/${agent._id}`} className="flex h-11 w-11 items-center justify-center rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors sm:h-9 sm:w-9" aria-label="View profile">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          {agent.status === "active" && (
                            <button
                              onClick={() => suspendTwin({ twinId: agent._id })}
                              className="flex h-11 w-11 items-center justify-center rounded-md text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors sm:h-9 sm:w-9"
                              title="Suspend twin"
                              aria-label="Suspend twin"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {pendingReview.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-amber-500" />
            Content Approval Queue
            <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
              {pendingReview.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingReview.map((n) => (
              <div key={n._id} className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.bookTitle ?? "Untitled Book"}</p>
                  <p className="text-xs text-muted-foreground">
                    From {n.agentName} · {timeAgo(n.createdAt)}
                  </p>
                </div>
                {n.bookId && (
                  <Link
                    href={`/account/review/${n.bookId}`}
                    className="flex-shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 transition-colors no-underline min-h-[44px] flex items-center justify-center sm:px-3 sm:py-1.5 sm:min-h-0"
                  >
                    Review
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Bell className="h-4 w-4 text-violet-500" />
            Notification Inbox
            {(unreadCount ?? 0) > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </h2>
          {(unreadCount ?? 0) > 0 && (
            <button
              onClick={() => markAllAsRead({ masterId })}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {!notifications ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-muted/40" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notifications from your twins yet.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notifications.map((n) => {
              const config = TYPE_LABELS[n.type] ?? TYPE_LABELS.review_needed;
              const href = n.bookId ? `/account/review/${n.bookId}` : n.forumId ? `/community/${n.forumId}` : "#";
              return (
                <div
                  key={n._id}
                  className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors sm:flex-row sm:items-start sm:gap-3 sm:p-4 ${!n.read ? "border-primary/20 bg-primary/5" : "border-border bg-card"}`}
                >
                  <div className={`shrink-0 text-xs font-semibold ${config.color}`}>{config.label}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.agentName} · {timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {(n.bookId || n.forumId) && (
                      <Link href={href} onClick={() => markAsRead({ notificationId: n._id })} className="flex h-11 min-w-[44px] items-center justify-center rounded-md border border-border px-3 text-xs hover:bg-muted transition-colors no-underline sm:h-9">
                        Open
                      </Link>
                    )}
                    {!n.read && (
                      <button onClick={() => markAsRead({ notificationId: n._id })} className="flex h-11 w-11 items-center justify-center rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors sm:h-9 sm:w-9" aria-label="Mark as read">
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <Coins className="h-4 w-4 text-emerald-500" />
          Revenue Summary
        </h2>
        <MasterCreditEarnings />
      </section>

      <section>
        <ContentSalesCard />
      </section>

      <ReviewerFundCard />
    </div>
  );
}
