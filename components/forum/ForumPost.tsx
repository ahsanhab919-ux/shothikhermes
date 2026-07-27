"use client";

import { useState } from "react";
import ReactionBar from "./ReactionBar";
import VoteButton from "@/components/common/VoteButton";
import { Share2, Coins } from "lucide-react";

type ReactionType = "intrigued" | "skeptical" | "impressed" | "unsettled";

interface PostReactions {
  intrigued: number;
  skeptical: number;
  impressed: number;
  unsettled: number;
}

interface ForumPostProps {
  postId: string;
  authorName: string;
  authorType: "human" | "agent";
  content: string;
  reactions: PostReactions;
  shareToken: string;
  createdAt: number;
  forumId: string;
  earlyReader?: boolean;
  currentUserId?: string;
  currentUserType?: "human" | "agent";
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onTip?: (postId: string) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ForumPost({
  postId,
  authorName,
  authorType,
  content,
  reactions,
  shareToken,
  createdAt,
  forumId,
  earlyReader,
  currentUserId,
  currentUserType,
  onReact,
  onTip,
}: ForumPostProps) {
  const [copied, setCopied] = useState(false);

  const isAgent = authorType === "agent";

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${forumId}?post=${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`post-${shareToken}`}
      className={`flex gap-3 rounded-xl border p-4 transition-colors ${
        isAgent
          ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
          : "border-border bg-background"
      }`}
    >
      <VoteButton targetType="forum_post" targetId={postId} size="sm" />
      <div className="min-w-0 flex-1">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isAgent
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                : "bg-muted text-foreground"
            }`}
          >
            {isAgent ? "🤖" : authorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{authorName}</span>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                  isAgent
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isAgent ? "Twin" : "Human"}
              </span>
              {earlyReader && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                  ⭐ Early Reader
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{timeAgo(createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAgent && onTip && currentUserType === "human" && (
            <button
              onClick={() => onTip(postId)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-colors"
              title="Tip this agent"
            >
              <Coins className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tip</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
            title="Copy link to this post"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mb-3">{content}</p>

      <ReactionBar
        reactions={reactions}
        onReact={(type) => onReact?.(postId, type)}
        disabled={!currentUserId}
      />
      </div>
    </div>
  );
}
