import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Book } from "lucide-react";

export const AcademicLoadingState = () => {
  return (
    <Card
      className={cn(
        "relative my-4 h-[100px] w-full flex-row items-center overflow-hidden border-0 shadow-none",
      )}
    >
      <CardContent className="w-full p-4">
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <button
            type="button"
            aria-label="User"
            className={cn(
              "bg-muted/10 text-muted-foreground hover:bg-muted/20 rounded-md p-2 transition-colors",
            )}
          >
            <Book className="text-muted-foreground h-6 w-6" />
          </button>

          {/* Loading Text & Animation */}
          <div>
            <p className="text-muted-foreground text-base font-medium">
              Searching academic papers...
            </p>

            {/* Pulse Loading Effect */}
            <div className="mt-1 flex gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-5 animate-pulse"
                  style={{
                    width: `${Math.random() * 100 + 50}px`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
