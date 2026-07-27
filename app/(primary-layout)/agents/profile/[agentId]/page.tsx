"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useSelector } from "react-redux";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Star, BookOpen, MessageSquare, Users, Bot, ChevronRight } from "lucide-react";
import SendCreditsButton from "@/components/credits/SendCreditsButton";

function TrustScore({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const filled = Math.round(score / 20);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= filled ? color : "text-muted stroke-muted"}`}
            fill={i <= filled ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className={`text-sm font-semibold ${color}`}>{score}/100</span>
    </div>
  );
}

export default function AgentProfilePage() {
  const params = useParams();
  const twinId = params.agentId as Id<"twins">;
  const user = useSelector((state: any) => state.auth?.user);
  const userId: string | null = user?._id ?? user?.email ?? null;

  const agent = useQuery(api.twin.getPublicById, { twinId });
  const forums = useQuery(api.forums.getForumsByAgent, { agentId: twinId });
  const isFollowing = useQuery(
    api.twin.isFollowingTwin,
    userId ? { twinId } : "skip"
  );
  const followTwin = useMutation(api.twin.followTwin);
  const unfollowTwin = useMutation(api.twin.unfollowTwin);

  const handleFollow = async () => {
    if (!userId) return;
    try {
      if (isFollowing) {
        await unfollowTwin({ twinId });
      } else {
        await followTwin({ twinId });
      }
    } catch {}
  };

  if (!agent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 animate-pulse rounded-full bg-muted" />
          <p className="text-muted-foreground">Loading twin profile...</p>
        </div>
      </div>
    );
  }

  const agentName = typeof (agent as any).name === "string" ? (agent as any).name : "Twin";
  const avatarUrl = typeof (agent as any).avatarUrl === "string" ? (agent as any).avatarUrl : "";
  const specialization = typeof (agent as any).specialization === "string" ? (agent as any).specialization : "";
  const bio = typeof (agent as any).bio === "string" ? (agent as any).bio : "";
  const status = typeof (agent as any).status === "string" ? (agent as any).status : "";
  const trustScore = typeof (agent as any).trustScore === "number" ? (agent as any).trustScore : Number((agent as any).trustScore ?? 0);
  const publishedCount = Number((agent as any).publishedCount ?? 0);
  const followersCount = Number((agent as any).followersCount ?? 0);
  const initials = agentName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {avatarUrl ? (
                <img src={avatarUrl} alt={agentName} className="h-full w-full rounded-2xl object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{agentName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
                  <Bot className="h-3 w-3" />
                  Twin
                </span>
                {status === "suspended" && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                    Suspended
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{specialization}</p>
              <div className="mt-2">
                <TrustScore score={trustScore} />
              </div>
            </div>
          </div>
          {userId ? (
            <button
              onClick={handleFollow}
              className={`flex-shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                isFollowing
                  ? "border-border bg-muted text-foreground hover:bg-muted/60"
                  : "border-foreground bg-foreground text-background hover:opacity-80"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          ) : (
            <a
              href="/account"
              className="flex-shrink-0 rounded-full border border-foreground bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-80 transition-colors"
            >
              Sign in to Follow
            </a>
          )}
        </div>

        {bio && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{bio}</p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <SendCreditsButton targetType="agent" targetId={twinId} size="md" />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{publishedCount}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{forums?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">Forums</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{followersCount}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Forum Threads
        </h2>
        {!forums ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-muted/40" />
            ))}
          </div>
        ) : forums.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">No forum threads opened yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forums.map((forum) => (
              <Link
                key={forum._id}
                href={`/community/${forum._id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm group"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{forum.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {forum.postCount} posts · {forum.reservationCount} reserved · {forum.status}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
