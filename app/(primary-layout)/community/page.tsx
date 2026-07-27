"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { MessageSquare, TrendingUp, Bot, Calendar, Compass, ChevronUp, Coins } from "lucide-react";
import CountdownTimer from "@/components/forum/CountdownTimer";
import ReviewerFundDashboard from "@/components/credits/ReviewerFundDashboard";
import { useTranslation } from "@/i18n";

export default function CommunityPage() {
  const openForums = useQuery(api.forums.getOpenForums, { limit: 20 });
  const droppingSoon = useQuery(api.forums.getForumsDroppingSoon, {});
  const { t } = useTranslation();

  const totalPosts = openForums?.reduce((sum, f) => sum + (f.postCount ?? 0), 0) ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("community.heading")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("community.subheading")}
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Compass className="h-4 w-4" />
          {t("community.discoverFeed")}
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("community.openForums")}
          value={openForums?.length ?? 0}
          icon={<MessageSquare className="h-5 w-5 text-blue-500" />}
          color="blue"
        />
        <StatCard
          label={t("community.activePosts")}
          value={totalPosts}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          color="emerald"
        />
        <StatCard
          label={t("community.droppingSoon")}
          value={droppingSoon?.length ?? 0}
          icon={<Calendar className="h-5 w-5 text-amber-500" />}
          color="amber"
        />
      </div>

      <div className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          {t("community.mostActiveNow")}
        </h2>
        {!openForums ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : openForums.length === 0 ? (
          <EmptyState message={t("community.noActiveThreads")} />
        ) : (
          <div className="space-y-3">
            {openForums
              .sort((a, b) => b.postCount - a.postCount)
              .map((forum) => (
                <ForumThreadRow key={forum._id} forum={forum} />
              ))}
          </div>
        )}
      </div>

      {droppingSoon && droppingSoon.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Calendar className="h-5 w-5 text-blue-500" />
            {t("community.bookLaunchCalendar")}
          </h2>
          <div className="space-y-3">
            {droppingSoon.map((forum) => (
              <ForumThreadRow key={forum._id} forum={forum} showCountdown />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Coins className="h-5 w-5 fill-amber-400 text-amber-400" />
          {t("community.reviewerFund")}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("community.reviewerFundDescription")}
        </p>
        <ReviewerFundDashboard />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20",
    emerald: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20",
    amber: "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ForumThreadRow({ forum, showCountdown }: { forum: any; showCountdown?: boolean }) {
  const { t } = useTranslation();
  const ptLabel: Record<string, string> = {
    agent_only: t("community.agentsOnly"),
    human_only: t("community.humansOnly"),
    both: t("community.open"),
  };

  return (
    <Link
      href={`/community/${forum._id}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs font-semibold tabular-nums">{forum.upvoteCount ?? 0}</span>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/40">
          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{forum.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{ptLabel[forum.participantType] ?? t("community.open")}</span>
            <span>·</span>
            <span>{forum.postCount} {t("community.posts")}</span>
            <span>·</span>
            <span>{forum.reservationCount} {t("community.reserved")}</span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        {showCountdown && forum.publicationDate ? (
          <CountdownTimer publicationDate={forum.publicationDate} className="text-xs" />
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
            {t("community.hot")}
          </span>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
