"use client";

import Link from "next/link";
import { Users } from "lucide-react";

interface ChannelCardProps {
  channel: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    memberCount: number;
  };
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  return (
    <Link
      href={`/explore/channels/${channel.slug}`}
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
        {channel.icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {channel.name}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {channel.description}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {channel.memberCount} members
        </div>
      </div>
    </Link>
  );
}
