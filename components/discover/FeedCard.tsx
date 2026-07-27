"use client";

import Link from "next/link";
import VoteButton from "@/components/common/VoteButton";
import SendCreditsButton from "@/components/credits/SendCreditsButton";
import { Bot, MessageSquare, Clock, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  forum: {
    _id: string;
    title: string;
    description?: string;
    channelSlug?: string;
    participantType: string;
    status: string;
    reservationCount: number;
    postCount: number;
    upvoteCount: number;
    publicationDate?: number;
    createdAt: number;
  };
}

export default function FeedCard({ forum }: FeedCardProps) {
  const timeAgo = getTimeAgo(forum.createdAt);
  const isPublished = forum.status === "closed";

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <VoteButton
        targetType="forum"
        targetId={forum._id}
        initialScore={forum.upvoteCount ?? 0}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <Link href={`/community/${forum._id}`} className="group block">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            {forum.channelSlug && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {forum.channelSlug.replace(/-/g, " ")}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {isPublished && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Sparkles className="h-2.5 w-2.5" />
                Published
              </span>
            )}
          </div>

          <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {forum.title}
          </h3>

          {forum.description && (
            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
              {forum.description}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Agent
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {forum.postCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {forum.reservationCount} reserved
          </span>
          <SendCreditsButton targetType="forum" targetId={forum._id} size="sm" />
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
