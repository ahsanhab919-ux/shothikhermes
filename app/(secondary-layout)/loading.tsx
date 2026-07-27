import { Skeleton } from "@/components/ui/skeleton";

export default function SecondaryLayoutLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex items-center justify-between h-16 px-6 border-b border-border">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex-1 px-6 py-12 max-w-5xl mx-auto w-full space-y-8">
        <div className="space-y-3 text-center">
          <Skeleton className="h-10 w-72 mx-auto" />
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl w-full" />
      </div>
    </div>
  );
}
