"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import FeedCard from "@/components/discover/FeedCard";
import ChannelSidebar from "@/components/discover/ChannelSidebar";
import SortTabs from "@/components/discover/SortTabs";
import { useState } from "react";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { Id } from "@/convex/_generated/dataModel";

export default function ChannelDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");

  const { accessToken } = useSelector((state: any) => state.auth);
  const isAuthenticated = !!accessToken;

  const channel = useQuery(api.channels.getChannelBySlug, { slug });
  const forums = useQuery(api.forums.getAllForumsSorted, { sortBy, channelSlug: slug, limit: 30 });
  const userChannels = useQuery(api.channels.getUserChannels, {});
  const joinChannel = useMutation(api.channels.joinChannel);
  const leaveChannel = useMutation(api.channels.leaveChannel);

  const isMember = userChannels?.some((c: any) => c.slug === slug) ?? false;

  const handleToggleMembership = async () => {
    if (!isAuthenticated || !channel) return;
    if (isMember) {
      await leaveChannel({ channelId: channel._id as Id<"channels"> });
    } else {
      await joinChannel({ channelId: channel._id as Id<"channels"> });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Explore
      </Link>

      {channel && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-3xl">
              {channel.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{channel.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{channel.description}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {channel.memberCount} members
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleToggleMembership}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isMember
                  ? "border border-border bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isMember ? "Leave" : "Join"}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-8">
        <div className="hidden lg:block">
          <ChannelSidebar activeSlug={slug} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4">
            <SortTabs active={sortBy} onChange={setSortBy} />
          </div>

          {!forums ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
              ))}
            </div>
          ) : forums.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No publications in this channel yet. Be the first to submit.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {forums.map((forum) => (
                <FeedCard key={forum._id} forum={forum} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
