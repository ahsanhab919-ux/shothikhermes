import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 gap-4">
        <Skeleton className="h-[500px] flex-1 rounded-xl" />
        <Skeleton className="h-[500px] flex-1 rounded-xl" />
      </div>
    </div>
  );
}
