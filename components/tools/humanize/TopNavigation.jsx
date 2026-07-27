import { StepRange } from "@/components/common/StepRange";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

const models = ["Panda", "Raven"];

const TopNavigation = ({
  model,
  setModel,
  setShalowAlert,
  userPackage,
  currentLength,
  setCurrentLength,
  LENGTH,
}) => {
  // Convert LENGTH object to StepRange steps format
  const levelSteps = useMemo(() => {
    return Object.entries(LENGTH)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, value]) => ({
        label: value,
        value: value,
        disabled: false,
      }));
  }, [LENGTH]);

  const handleTabClick = (tab) => {
    setShalowAlert(false);
    setModel(tab);
  };

  return (
    <>
      <div className="border-border flex items-center justify-between gap-4 border-b px-4 py-2">
        {/* Model Selection Tabs */}
        <Tabs
          value={model}
          onValueChange={handleTabClick}
          className="w-auto shrink-0"
        >
          <TabsList className="bg-muted/50 p-1">
            {models.map((tab) => {
              // Raven is now available to all users (lock removed)
              const isActive = model === tab;
              return (
                <TooltipProvider key={tab}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value={tab}
                        className={cn(
                          "relative transition-all duration-200",
                          "min-w-[80px] rounded-md px-4 py-2",
                          // Same font size for both tabs (16px = text-base)
                          "text-base font-medium",
                          // Base styles - use important to override defaults
                          "!border-transparent !bg-transparent",
                          // Active state - transparent background with primary text color
                          isActive
                            ? "!text-primary font-semibold"
                            : "text-muted-foreground",
                          // Force override default active styles with important
                          "data-[state=active]:!bg-transparent",
                          "data-[state=active]:!text-primary",
                          "data-[state=active]:!font-semibold",
                          "data-[state=active]:!text-base",
                          "data-[state=active]:!shadow-none",
                          "data-[state=active]:!border-transparent",
                          // Override dark mode active styles
                          "dark:data-[state=active]:!bg-transparent",
                          "dark:data-[state=active]:!text-primary",
                          // Inactive state - same font size
                          "data-[state=inactive]:!bg-transparent",
                          "data-[state=inactive]:text-muted-foreground",
                          "data-[state=inactive]:!text-base",
                          "hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        {tab}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tab === "Panda"
                        ? "General-purpose language processing"
                        : "Advanced model for essays, research papers, and SEO writing"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Level Selection using StepRange - Positioned beside tabs with perfect gap */}
        <div className="flex w-full max-w-52 min-w-0 flex-col gap-2">
          <div className="flex w-full flex-col gap-2">
            <StepRange
              value={currentLength}
              onChange={setCurrentLength}
              steps={levelSteps}
              className="w-full"
            />
            {/* <div className="flex items-center justify-between px-1 text-xs">
            {levelSteps.map((step) => (
              <span
                key={step.value}
                className={cn(
                  "transition-colors",
                  currentLength === step.value
                    ? "text-primary font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            ))}
          </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNavigation;
