import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PricingPlanCardSkeleton = () => (
  <Card
    className={cn(
      "bg-background relative mx-auto flex w-full max-w-[450px] flex-col justify-between gap-0 p-8 shadow-lg",
      "md:max-w-[550px]",
    )}
  >
    <div className="flex flex-col">
      {/* Price skeleton */}
      <div className="flex flex-row gap-2">
        <Skeleton className="h-10 w-20 rounded" />
        <Skeleton className="h-5 w-[60px]" />
      </div>

      {/* Title skeleton */}
      <Skeleton className="mt-2 h-8 w-[120px]" />

      {/* Subtitle skeleton */}
      <Skeleton className="mt-1 h-4 w-[100px]" />

      {/* Features list skeleton */}
      <ul className="my-6 flex flex-col gap-4 p-0">
        {Array.from({ length: 5 }).map((_, index) => (
          <li key={index} className="flex flex-row items-start gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-[200px]" />
          </li>
        ))}
      </ul>
    </div>

    {/* Button skeleton */}
    <Skeleton className="h-12 w-full rounded" />
  </Card>
);

export default PricingPlanCardSkeleton;
