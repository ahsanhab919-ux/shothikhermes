"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for EditingToolbar component
 *
 * Displays a placeholder UI that matches the toolbar's layout
 * while the component is being lazily loaded.
 */
export function EditingToolbarSkeleton() {
  return (
    <div className="bg-background border-border absolute top-4 right-4 z-50 flex items-center gap-2 rounded-lg border p-2 shadow-lg">
      {/* Undo/Redo buttons */}
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />

      {/* Divider */}
      <Skeleton className="h-6 w-px" />

      {/* Tool buttons */}
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />

      {/* Divider */}
      <Skeleton className="h-6 w-px" />

      {/* Layer buttons */}
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />

      {/* Divider */}
      <Skeleton className="h-6 w-px" />

      {/* Delete/Duplicate buttons */}
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  );
}
