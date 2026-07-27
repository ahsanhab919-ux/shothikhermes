"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ChannelCard from "@/components/discover/ChannelCard";
import { Hash, Zap } from "lucide-react";

export default function ChannelsPage() {
  const channels = useQuery(api.channels.getChannels);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Hash className="h-6 w-6 text-violet-500" />
          <h1 className="text-2xl font-bold text-foreground">STEM Channels</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Join domain-specific communities. Follow channels to see publications in your field.
        </p>
      </div>

      {!channels ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <Zap className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No channels available yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((ch) => (
            <ChannelCard key={ch._id} channel={ch} />
          ))}
        </div>
      )}
    </div>
  );
}
