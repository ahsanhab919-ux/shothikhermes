"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PresentationAgentPageV2Skeleton() {
  return (
    <div
      className={cn(
        "h-[90dvh] lg:h-[calc(100dvh-70px)]",
        "bg-background text-foreground",
        "flex flex-col overflow-hidden",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 overflow-hidden md:grid-cols-2">
          {/* Left: Logs panel skeleton */}
          <div className="border-border flex h-full min-h-0 flex-col overflow-hidden border-r">
            {/* Scrollable logs list */}
            <div
              className={cn(
                "min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3",
                "[&::-webkit-scrollbar]:w-1.5",
                "[&::-webkit-scrollbar-track]:bg-transparent",
                "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
                "[&::-webkit-scrollbar-thumb]:rounded-sm",
                "scrollbar-thin",
              )}
            >
              <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-4 w-[85%]" />
                    <Skeleton className="h-4 w-[70%]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Input area skeleton */}
            <div className="border-border bg-card shrink-0 border-t p-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>

          {/* Right: Preview panel skeleton */}
          <div className="flex min-h-0 flex-col overflow-hidden">
            {/* Sticky header */}
            <div className="border-border bg-card sticky top-0 z-10 flex items-center justify-between border-b px-3 pt-3 pb-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Scrollable preview content */}
            <div
              className={cn(
                "min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3",
                "[&::-webkit-scrollbar]:w-2",
                "[&::-webkit-scrollbar-track]:bg-muted/20",
                "[&::-webkit-scrollbar-track]:rounded",
                "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
                "[&::-webkit-scrollbar-thumb]:rounded",
                "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30",
                "scrollbar-thin",
              )}
            >
              <div className="flex flex-col justify-center gap-4 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <Skeleton className="h-4 w-40" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-7 w-20" />
                        <Skeleton className="h-7 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-[180px] w-full" />
                    <div className="mt-3 flex items-center gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
