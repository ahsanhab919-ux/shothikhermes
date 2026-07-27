"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  targetType: "book" | "forum_post" | "forum";
  targetId: string;
  initialScore?: number;
  layout?: "vertical" | "horizontal";
  size?: "sm" | "md";
}

export default function VoteButton({
  targetType,
  targetId,
  initialScore = 0,
  layout = "vertical",
  size = "md",
}: VoteButtonProps) {
  const { accessToken } = useSelector((state: any) => state.auth);
  const isAuthenticated = !!accessToken;

  const voteTotals = useQuery(api.votes.getVotesForTarget, { targetType, targetId });
  const userVote = useQuery(api.votes.getVoteByUser, { targetType, targetId });
  const castVote = useMutation(api.votes.castVote);

  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const [optimisticUserVote, setOptimisticUserVote] = useState<number | null | undefined>(undefined);

  const score = (voteTotals?.score ?? initialScore) + optimisticDelta;
  const currentVote = optimisticUserVote !== undefined ? optimisticUserVote : userVote;

  const handleVote = useCallback(
    async (value: 1 | -1) => {
      if (!isAuthenticated) return;

      const wasVote = optimisticUserVote !== undefined ? optimisticUserVote : userVote;

      if (wasVote === value) {
        setOptimisticDelta((d) => d - value);
        setOptimisticUserVote(null);
      } else if (wasVote === -value) {
        setOptimisticDelta((d) => d + value * 2);
        setOptimisticUserVote(value);
      } else {
        setOptimisticDelta((d) => d + value);
        setOptimisticUserVote(value);
      }

      try {
        await castVote({ targetType, targetId, value });
      } catch {
        setOptimisticDelta(0);
        setOptimisticUserVote(undefined);
      }
    },
    [isAuthenticated, userVote, optimisticUserVote, castVote, targetType, targetId]
  );

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "p-1.5 min-w-[36px] min-h-[36px]" : "p-2 min-w-[44px] min-h-[44px] sm:p-1 sm:min-w-0 sm:min-h-0";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        layout === "vertical" ? "flex-col" : "flex-row"
      )}
    >
      <button
        onClick={() => handleVote(1)}
        disabled={!isAuthenticated}
        className={cn(
          "rounded transition-colors flex items-center justify-center",
          buttonSize,
          currentVote === 1
            ? "text-orange-500"
            : "text-muted-foreground hover:text-foreground",
          !isAuthenticated && "cursor-default opacity-50"
        )}
        aria-label="Upvote"
      >
        <ChevronUp className={iconSize} strokeWidth={currentVote === 1 ? 3 : 2} />
      </button>

      <span
        className={cn(
          "font-semibold tabular-nums",
          textSize,
          score > 0 && "text-orange-500",
          score < 0 && "text-blue-500",
          score === 0 && "text-muted-foreground"
        )}
      >
        {score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={!isAuthenticated}
        className={cn(
          "rounded transition-colors flex items-center justify-center",
          buttonSize,
          currentVote === -1
            ? "text-blue-500"
            : "text-muted-foreground hover:text-foreground",
          !isAuthenticated && "cursor-default opacity-50"
        )}
        aria-label="Downvote"
      >
        <ChevronDown className={iconSize} strokeWidth={currentVote === -1 ? 3 : 2} />
      </button>
    </div>
  );
}
