import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Edit,
  FileText,
  Hourglass,
  Image as ImageIcon,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

const stepIcons = {
  queued: <Hourglass className="size-5" />,
  generate_query: <Brain className="size-5" />,
  web_research: <Search className="size-5" />,
  reflection: <Brain className="size-5" />,
  finalize_answer: <Edit className="size-5" />,
  completed: <CheckCircle className="size-5" />,
};

const stepLabels = {
  queued: "Queued",
  generate_query: "Generating Search Queries",
  web_research: "Web Research",
  reflection: "Analyzing Results",
  finalize_answer: "Finalizing Answer",
  completed: "Completed",
};

const stepDescriptions = {
  queued: "Your research request has been queued for processing",
  generate_query: "Creating optimized search queries for research",
  web_research: "Searching the web for relevant information",
  reflection: "Analyzing research results and identifying gaps",
  finalize_answer: "Composing and presenting the final research answer",
  completed: "Research has been completed successfully",
};

export default function StreamingIndicator({
  streamEvents,
  isPolling = false,
  connectionStatus = "connected",
  onRetry,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [aggregatedData, setAggregatedData] = useState({
    totalSources: 0,
    totalImages: 0,
    searchQueries: [],
    researchLoops: 0,
    messages: [],
    currentMessage: "",
  });

  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case "polling":
        return {
          variant: "default",
          text: "Reconnecting to research stream...",
          icon: <Hourglass className="size-4" />,
        };
      case "reconnecting":
        return {
          variant: "default",
          text: "Attempting to reconnect...",
          icon: <Hourglass className="size-4" />,
        };
      case "failed":
        return {
          variant: "destructive",
          text: "Connection lost - click to retry",
          icon: <AlertCircle className="size-4" />,
        };
      case "timeout":
        return {
          variant: "destructive",
          text: "Connection timeout - please refresh",
          icon: <AlertCircle className="size-4" />,
        };
      default:
        return null;
    }
  };

  const statusInfo = getConnectionStatusInfo();

  useEffect(() => {
    if (streamEvents && streamEvents.length > 0) {
      const latestEvent = streamEvents[streamEvents.length - 1];
      const stepOrder = [
        "queued",
        "generate_query",
        "web_research",
        "reflection",
        "finalize_answer",
        "completed",
      ];

      const stepIndex = stepOrder.indexOf(latestEvent.step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        const completed = new Set();
        for (let i = 0; i < stepIndex; i++) {
          completed.add(stepOrder[i]);
        }
        setCompletedSteps(completed);
      }

      // Aggregate data from all events
      const newAggregatedData = {
        totalSources: 0,
        totalImages: 0,
        searchQueries: [],
        researchLoops: 0,
        messages: [],
        currentMessage: "",
      };

      streamEvents.forEach((event) => {
        // Count sources from web_research events
        if (event.step === "web_research" && event.data?.sources_gathered) {
          newAggregatedData.totalSources += event.data.sources_gathered.length;
        }

        // Count images
        if (event.data?.images_found) {
          newAggregatedData.totalImages += event.data.images_found;
        }

        // Collect search queries
        if (
          event.data?.search_query &&
          !newAggregatedData.searchQueries.includes(event.data.search_query)
        ) {
          newAggregatedData.searchQueries.push(event.data.search_query);
        }

        // Count research loops
        if (event.step === "reflection") {
          newAggregatedData.researchLoops += 1;
        }

        // Collect messages
        if (
          event.data?.message &&
          event.data.message !== stepDescriptions[event.step]
        ) {
          newAggregatedData.messages.push({
            step: event.step,
            message: event.data.message,
            timestamp: event.timestamp,
          });
        }
      });

      // Set current streaming message
      if (latestEvent.data?.message) {
        newAggregatedData.currentMessage = latestEvent.data.message;
      }

      // For completed step, get final counts from the data
      if (latestEvent.step === "completed" && latestEvent.data) {
        newAggregatedData.totalSources =
          latestEvent.data.sources?.length || newAggregatedData.totalSources;
        newAggregatedData.totalImages =
          latestEvent.data.images?.length || newAggregatedData.totalImages;
        newAggregatedData.researchLoops =
          latestEvent.data.research_loops || newAggregatedData.researchLoops;
      }

      setAggregatedData(newAggregatedData);
    }
  }, [streamEvents]);

  if (!streamEvents || streamEvents.length === 0) {
    return null;
  }

  const latestEvent = streamEvents[streamEvents.length - 1];
  const currentStepName = latestEvent.step;
  const isCompleted = currentStepName === "completed";

  return (
    <>
      {statusInfo && (
        <div className="mb-4">
          <Alert
            variant={statusInfo.variant}
            className={cn(
              "flex items-center justify-between",
              statusInfo.variant === "destructive" && "bg-destructive/10",
            )}
          >
            <div className="flex items-center gap-2">
              {statusInfo.icon}
              <AlertDescription>{statusInfo.text}</AlertDescription>
            </div>
            {connectionStatus === "failed" && onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                Retry
              </Button>
            )}
          </Alert>
        </div>
      )}

      <Card className={cn("bg-muted/50 mb-12 border", "xl:mb-3")}>
        <CardContent className="pt-6">
          {/* Main Status Header */}
          <div className="mb-4 flex items-center">
            <div className="text-muted-foreground mr-4">
              {stepIcons[currentStepName] || <Hourglass className="size-5" />}
            </div>
            <div className="flex-1">
              <h3 className="mb-1 text-lg font-semibold">
                {latestEvent.data?.title ||
                  stepLabels[currentStepName] ||
                  "Processing..."}
              </h3>
              <p className="text-muted-foreground text-sm">
                {aggregatedData.currentMessage ||
                  stepDescriptions[currentStepName] ||
                  "Working on your request..."}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                isPolling && "border-destructive/50 text-destructive",
                isCompleted && "border-primary text-primary",
                !isPolling && !isCompleted && "border-primary text-primary",
              )}
            >
              {isPolling
                ? "Reconnecting..."
                : isCompleted
                  ? "Completed"
                  : "In Progress"}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress
              value={isCompleted ? 100 : (currentStep + 1) * 16.67}
              className="h-1.5"
            />
            <p className="text-muted-foreground mt-1 block text-xs">
              Step {currentStep + 1} of 6 •{" "}
              {Math.round(isCompleted ? 100 : (currentStep + 1) * 16.67)}%
              Complete
            </p>
          </div>

          {/* Real-time Data Grid */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-background rounded-md p-2 text-center">
              <div className="relative inline-flex items-center justify-center">
                <FileText className="text-muted-foreground size-5" />
                {aggregatedData.totalSources > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]"
                  >
                    {aggregatedData.totalSources > 999
                      ? "999+"
                      : aggregatedData.totalSources}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 block text-xs">
                Sources Found
              </p>
            </div>

            <div className="bg-background rounded-md p-2 text-center">
              <div className="relative inline-flex items-center justify-center">
                <ImageIcon className="text-muted-foreground size-5" />
                {aggregatedData.totalImages > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]"
                  >
                    {aggregatedData.totalImages > 999
                      ? "999+"
                      : aggregatedData.totalImages}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 block text-xs">
                Images Found
              </p>
            </div>

            <div className="bg-background rounded-md p-2 text-center">
              <div className="relative inline-flex items-center justify-center">
                <Search className="text-muted-foreground size-5" />
                {aggregatedData.searchQueries.length > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]"
                  >
                    {aggregatedData.searchQueries.length > 999
                      ? "999+"
                      : aggregatedData.searchQueries.length}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 block text-xs">
                Search Queries
              </p>
            </div>

            <div className="bg-background rounded-md p-2 text-center">
              <div className="relative inline-flex items-center justify-center">
                <TrendingUp className="text-muted-foreground size-5" />
                {aggregatedData.researchLoops > 0 && (
                  <Badge
                    variant="outline"
                    className="border-destructive/50 text-destructive absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]"
                  >
                    {aggregatedData.researchLoops > 999
                      ? "999+"
                      : aggregatedData.researchLoops}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 block text-xs">
                Research Loops
              </p>
            </div>
          </div>

          {/* Current Search Queries (if available) */}
          {aggregatedData.searchQueries.length > 0 && (
            <div className="mb-4">
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                Search Queries Generated:
              </p>
              <div className="flex flex-wrap gap-1">
                {aggregatedData.searchQueries
                  .slice(0, 3)
                  .map((query, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-[0.7rem]"
                    >
                      {query.length > 40 ? `${query.slice(0, 40)}...` : query}
                    </Badge>
                  ))}
                {aggregatedData.searchQueries.length > 3 && (
                  <Badge
                    variant="outline"
                    className="border-primary text-primary text-[0.7rem]"
                  >
                    +{aggregatedData.searchQueries.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Step-specific Information */}
          {currentStepName === "web_research" &&
            latestEvent.data?.sources_gathered && (
              <div className="bg-primary/10 mt-4 rounded-md p-4">
                <p className="text-muted-foreground text-sm">
                  <strong>Sources gathered this round:</strong>{" "}
                  {latestEvent.data.sources_gathered.length}
                </p>
              </div>
            )}

          {currentStepName === "queued" &&
            latestEvent.data?.position !== undefined && (
              <div className="bg-destructive/10 mt-4 rounded-md p-4">
                <p className="text-muted-foreground text-sm">
                  <strong>Queue position:</strong> #
                  {latestEvent.data.position + 1}
                </p>
              </div>
            )}

          {isCompleted && (
            <div className="bg-primary/10 mt-4 rounded-md p-4">
              <p className="text-primary text-sm font-medium">
                ✓ Research completed successfully with{" "}
                {aggregatedData.totalSources} sources and{" "}
                {aggregatedData.totalImages} images
              </p>
            </div>
          )}

          <Separator className="my-4" />

          {/* Footer with metadata */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {latestEvent.researchId &&
                `ID: ${latestEvent.researchId.slice(-8)}`}
            </p>
            <p className="text-muted-foreground text-xs">
              {new Date(latestEvent.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
