"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";

interface ChannelSidebarProps {
  activeSlug?: string;
}

export default function ChannelSidebar({ activeSlug }: ChannelSidebarProps) {
  const channels = useQuery(api.channels.getChannels);

  if (!channels) {
    return (
      <div className="w-56 shrink-0 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Channels
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 animate-pulse rounded bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Channels
        </span>
        <Link
          href="/explore/channels"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-0.5">
        <Link
          href="/explore"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            !activeSlug
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Hash className="h-3.5 w-3.5" />
          All Topics
        </Link>

        {channels.map((ch) => (
          <Link
            key={ch._id}
            href={`/explore/channels/${ch.slug}`}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              activeSlug === ch.slug
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="text-sm">{ch.icon}</span>
            <span className="truncate">{ch.name}</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">
              {ch.memberCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
