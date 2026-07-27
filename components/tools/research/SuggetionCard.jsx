import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Activity,
  Brain,
  Code,
  DollarSign,
  Flag,
  Heart,
  Languages,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const SuggestionCards = ({ trendingQueries, handleExampleClick }) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll function
  const autoScroll = () => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollBy({
        left: 1, // Adjust this value to control scroll speed
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const scrollInterval = setInterval(autoScroll, 20);

    return () => clearInterval(scrollInterval);
  }, [isPaused]);

  const getIconForCategory = (category) => {
    const iconMap = {
      trending: <TrendingUp className="h-4 w-4" />,
      community: <Users className="h-4 w-4" />,
      science: <Brain className="h-4 w-4" />,
      tech: <Code className="h-4 w-4" />,
      travel: <Languages className="h-4 w-4" />,
      politics: <Flag className="h-4 w-4" />,
      health: <Heart className="h-4 w-4" />,
      sports: <Activity className="h-4 w-4" />,
      finance: <DollarSign className="h-4 w-4" />,
      football: <Target className="h-4 w-4" />,
    };

    return iconMap[category] || <TrendingUp className="h-4 w-4" />;
  };

  if (!trendingQueries?.length) {
    return (
      <div className="mt-8">
        <div
          className={cn(
            "flex gap-4 overflow-x-auto scroll-smooth px-2 pb-4 [&::-webkit-scrollbar]:hidden",
          )}
        >
          {[1, 2, 3, 4, 5, 6].map((_, index) => (
            <div
              key={index}
              className={cn(
                "bg-card border-border h-12 w-[120px] shrink-0 rounded-md border",
                "flex items-start gap-3 p-4",
              )}
            >
              {/* Skeleton placeholder for image */}
              <Skeleton className="h-4 w-4 rounded" />

              {/* Text skeleton */}
              <div className="flex-1 space-y-1">
                <Skeleton className="h-2.5 rounded" />
                <Skeleton className="h-2 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-2 overflow-x-auto scroll-smooth px-2 pb-4 [&::-webkit-scrollbar]:hidden",
        )}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => {
          // Add a small delay before resuming animation on mobile
          setTimeout(() => setIsPaused(false), 1000);
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {Array(20)
          .fill(trendingQueries)
          .flat()
          .map((query, index) => (
            <Card
              key={index}
              onClick={() => handleExampleClick(query)}
              className={cn(
                "bg-card rounded shadow-none transition-all duration-200 hover:shadow-md",
                "flex min-w-[150px] cursor-pointer flex-row items-center p-2",
              )}
            >
              <CardContent className="flex flex-row items-start p-0 last:pb-0">
                <div
                  className={cn(
                    "bg-primary/5 text-muted-foreground rounded-[5px] p-0.5",
                    "flex items-center justify-center",
                  )}
                  aria-label="Category"
                >
                  {getIconForCategory(query.category)}
                </div>
                <div className="flex-grow overflow-hidden text-left">
                  <p
                    className={cn(
                      "line-clamp-1 font-medium",
                      "text-sm leading-normal",
                    )}
                  >
                    {query.text}
                  </p>
                  <p
                    className={cn(
                      "text-muted-foreground capitalize",
                      "text-xs leading-normal",
                    )}
                  >
                    {query.category}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};
