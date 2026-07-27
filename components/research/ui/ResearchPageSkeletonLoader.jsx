"use client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResearchPageSkeletonLoader() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-3">
      {/* Header Section */}
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Tab Navigation */}
      <div className="border-border mb-3 border-b">
        <div className="mb-2 flex gap-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-[60px]" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-6 w-[70px]" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-muted mb-2 p-3">
        {/* Title */}
        <Skeleton className="mb-3 h-[45px] w-[60%]" />

        {/* Introduction Section */}
        <div className="mb-4">
          <Skeleton className="mb-2 h-7 w-[120px]" />

          {/* Paragraph skeletons */}
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[95%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
          </div>
        </div>

        {/* Section 1 */}
        <div className="mb-4">
          <Skeleton className="mb-2 h-8 w-[70%]" />

          {/* Section content */}
          <div className="mb-3 space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[93%]" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[45%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
