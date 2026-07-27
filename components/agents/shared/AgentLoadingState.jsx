import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const AgentLoadingState = ({
  variant = "circular",
  message = "Loading...",
  lines = 3,
}) => {
  if (variant === "skeleton") {
    return (
      <div>
        {[...Array(lines)].map((_, i) => (
          <Skeleton key={i} className={cn("mb-1 h-7 rounded-md")} />
        ))}
      </div>
    );
  }
  if (variant === "text") {
    return (
      <div className="flex min-h-20 items-center justify-center">
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    );
  }
  // Default: circular
  return (
    <div className="flex min-h-20 flex-col items-center justify-center">
      <Spinner className={cn("text-primary mb-2")} />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
};

export default AgentLoadingState;
