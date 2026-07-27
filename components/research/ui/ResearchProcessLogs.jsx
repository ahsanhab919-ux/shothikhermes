"use client";

import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Timeline UI with clickable sources and a "shine" animation on the last message title.
 *
 * Props:
 *  - streamEvents: array of SSE event objects
 *  - researches: optional meta info
 *  - isStreaming: boolean
 */

const STEP_LABELS = {
  queued: "Queued",
  generate_query: "Query generation",
  web_research: "Web research",
  reflection: "Analysis & reflection",
  finalize_answer: "Finalizing answer",
  image_search: "Image search",
  completed: "Completed",
};

const defaultFormatTime = (ts) => {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return String(ts);
  }
};

const shortText = (text, n = 220) => {
  if (!text) return "";
  const s = String(text).trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
};

const aggregateFromEvents = (events = []) => {
  const summary = { totalSources: 0, totalQueries: 0, researchLoops: 0 };
  const aggregatedSources = [];
  const queries = [];
  events.forEach((ev) => {
    if (ev?.data?.sources_gathered && Array.isArray(ev.data.sources_gathered)) {
      aggregatedSources.push(...ev.data.sources_gathered);
    }
    if (ev?.data?.sources && Array.isArray(ev.data.sources)) {
      aggregatedSources.push(...ev.data.sources);
    }
    if (ev?.data?.sources_count) {
      summary.totalSources = Math.max(
        summary.totalSources,
        ev.data.sources_count,
      );
    }
    if (ev?.data?.search_query && Array.isArray(ev.data.search_query)) {
      queries.push(...ev.data.search_query);
    }
    if (ev?.data?.search_queries && Array.isArray(ev.data.search_queries)) {
      queries.push(...ev.data.search_queries);
    }
    if (ev?.data?.research_loops) {
      summary.researchLoops = Math.max(
        summary.researchLoops,
        ev.data.research_loops,
      );
    }
  });

  // dedupe by url/title if possible
  const uniqueSources = [];
  const seen = new Set();
  aggregatedSources.forEach((s) => {
    const key = (s.url || s.title || JSON.stringify(s)).toString();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSources.push(s);
    }
  });

  summary.totalSources = Math.max(summary.totalSources, uniqueSources.length);
  summary.totalQueries = queries.length;

  return { summary, uniqueSources, queries };
};

const ProcessTimelineItem = React.memo(({ ev, isLast, isActive }) => {
  const stepLabel = STEP_LABELS[ev.step] || ev.step || "Step";
  const timestamp = ev.timestamp ? defaultFormatTime(ev.timestamp) : "";
  const messageCandidates = [
    ev.data?.message,
    ev.data?.title,
    ev.data?.text,
    ev.data?.output,
    ev.data?.description,
  ];
  const message = messageCandidates.find(Boolean) || null;

  const badges = [];
  if (ev.data?.sources_gathered?.length)
    badges.push(`${ev.data.sources_gathered.length} sources`);
  if (ev.data?.sources_count) badges.push(`${ev.data.sources_count} sources`);
  if (ev.data?.search_query?.length)
    badges.push(`${ev.data.search_query.length} queries`);
  if (ev.data?.search_queries?.length)
    badges.push(`${ev.data.search_queries.length} queries`);
  if (ev.data?.images_found !== undefined)
    badges.push(`${ev.data.images_found} images`);

  return (
    <div className="relative flex gap-3 pb-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full shadow-none",
            isActive ? "bg-primary animate-pulse" : "bg-muted-foreground/40",
          )}
        />
        {!isLast && <div className="bg-border w-0.5 flex-1" />}
      </div>

      {/* Timeline Content */}
      <div className="flex-1 py-1">
        <Card className="mb-1 rounded">
          <CardContent className="pt-1 pb-3">
            <div className="flex justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  <span
                    className={cn(
                      "relative inline-block overflow-hidden",
                      isLast && "animate-shine",
                    )}
                  >
                    {stepLabel}
                  </span>
                </p>

                {message && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {shortText(message, 260)}
                  </p>
                )}

                {Array.isArray(ev.data?.search_query) &&
                  ev.data.search_query.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ev.data.search_query.slice(0, 3).map((q, i) => (
                        <Badge key={i} variant="outline">
                          {shortText(q, 40)}
                        </Badge>
                      ))}
                      {ev.data.search_query.length > 3 && (
                        <Badge variant="default">
                          +{ev.data.search_query.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
              </div>

              <div className="ml-1 flex flex-col items-end">
                <span className="text-muted-foreground text-xs">
                  {timestamp}
                </span>

                <div className="mt-0.5 flex flex-wrap justify-end gap-0.5">
                  {badges.slice(0, 3).map((b, i) => (
                    <Badge key={i} variant="outline">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

const ResearchProcessLogs = ({
  streamEvents = [],
  researches = [],
  isStreaming = false,
}) => {
  const { summary, uniqueSources, queries } = useMemo(
    () => aggregateFromEvents(streamEvents),
    [streamEvents],
  );

  const activeIndex = useMemo(() => {
    if (!Array.isArray(streamEvents) || streamEvents.length === 0) return -1;
    if (isStreaming) {
      for (let i = streamEvents.length - 1; i >= 0; i--) {
        if (streamEvents[i].step !== "completed") {
          return i;
        }
      }
    }
    return streamEvents.length - 1;
  }, [streamEvents, isStreaming]);

  if (!Array.isArray(streamEvents) || streamEvents.length === 0) return null;

  const mainTitle =
    (researches &&
      researches[0] &&
      (researches[0].title || researches[0].name)) ||
    streamEvents[0]?.data?.title ||
    "Research Process";

  return (
    <div className="mb-3">
      {/* Header */}
      <Card className="mb-2 rounded border">
        <CardContent className="p-2">
          <h6 className="mb-0.5 text-lg font-bold">{mainTitle}</h6>

          <div className="mb-1 flex flex-wrap items-center gap-1">
            <span className="text-muted-foreground mr-1 text-sm">
              Searching
            </span>

            {queries && queries.length > 0 ? (
              <>
                {queries.slice(0, 3).map((q, i) => (
                  <Badge key={i} variant="outline">
                    {shortText(q, 36)}
                  </Badge>
                ))}
                {queries.length > 3 && (
                  <Badge variant="default">+{queries.length - 3} more</Badge>
                )}
              </>
            ) : (
              <Badge variant="outline">no queries yet</Badge>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-1">
              {summary.totalSources > 0 && (
                <Badge variant="default">{summary.totalSources} sources</Badge>
              )}
              {summary.totalQueries > 0 && (
                <Badge variant="default">{summary.totalQueries} queries</Badge>
              )}
              {summary.researchLoops > 0 && (
                <Badge variant="default">{summary.researchLoops} loops</Badge>
              )}
            </div>
          </div>

          <Separator className="my-1" />

          {/* Sources preview block with clickable links */}
          <div className="mt-1">
            <p className="text-muted-foreground mb-1 text-sm">
              Reviewing sources — {uniqueSources.length}
            </p>

            <div className="border-border max-h-40 overflow-auto rounded border p-1">
              <div className="space-y-1">
                {uniqueSources.length === 0 && (
                  <span className="text-muted-foreground text-xs">
                    No sources found yet.
                  </span>
                )}

                {uniqueSources.slice(0, 8).map((s, i) => {
                  const title =
                    s.title || s.name || s.label || s.url || "Untitled";
                  const domain = (() => {
                    try {
                      return s.url
                        ? new URL(s.url).hostname.replace("www.", "")
                        : "";
                    } catch {
                      return "";
                    }
                  })();

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-1"
                    >
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium no-underline hover:underline"
                        >
                          {shortText(title, 60)}
                        </a>
                      ) : (
                        <span className="text-[13px] font-medium">
                          {shortText(title, 60)}
                        </span>
                      )}

                      <span className="text-muted-foreground text-xs">
                        {domain}
                      </span>
                    </div>
                  );
                })}

                {uniqueSources.length > 8 && (
                  <span className="text-muted-foreground text-xs">
                    +{uniqueSources.length - 8} more...
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div>
        {streamEvents.map((ev, idx) => (
          <ProcessTimelineItem
            key={`${ev.step}-${ev.timestamp || idx}-${idx}`}
            ev={ev}
            isLast={idx === streamEvents.length - 1}
            isActive={idx === activeIndex}
          />
        ))}
      </div>
    </div>
  );
};

export default ResearchProcessLogs;
