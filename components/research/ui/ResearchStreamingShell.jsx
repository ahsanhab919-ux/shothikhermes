"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { researchCoreState } from "@/redux/slices/researchCoreSlice";
import Image from "next/image";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import ResearchProcessLogs from "./ResearchProcessLogs";

const ResearchStreamingShell = ({
  streamEvents = [],
  isStreaming = false,
  userQuery = "",
}) => {
  const [selectedTab, setSelectedTab] = useState("0");
  const [titleCharCount, setTitleCharCount] = useState(100);
  const researchCoreData = useSelector(researchCoreState);

  // Get the query from session storage if not provided
  const displayQuery =
    userQuery ||
    sessionStorage.getItem("initialResearchPrompt") ||
    researchCoreData?.userPrompt ||
    "";

  // Truncate title to match HeaderTitle component behavior
  const getTruncatedTitle = (text, maxChars) => {
    if (!text) return "Research in Progress...";
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + "…";
  };

  const handleTabChange = (newValue) => {
    setSelectedTab(newValue);
  };

  // Calculate dynamic counts based on streaming events
  const getSourceCount = () => {
    let total = 0;
    streamEvents.forEach((event) => {
      if (event.data?.sources_gathered) {
        total += event.data.sources_gathered.length;
      }
      if (event.data?.sources_count) {
        total = Math.max(total, event.data.sources_count);
      }
    });
    return total;
  };

  const getImageCount = () => {
    const imageEvents = streamEvents.filter(
      (event) => event.step === "image_search" && event.data?.images_found > 0,
    );
    return imageEvents.reduce(
      (total, event) => total + (event.data?.images_found || 0),
      0,
    );
  };

  const sourceCount = getSourceCount();
  const imageCount = getImageCount();

  return (
    <div className="my-3 w-full pt-5 relative z-10 bg-background">
      <div className="bg-background sticky top-0 z-40">
        {/* Header Section - Matches HeaderTitle */}
        <div className="relative flex items-center justify-between gap-4 p-1 xl:mb-1">
          <h1
            className={cn(
              "cursor-pointer text-base font-bold hover:opacity-80",
              "sm:text-base md:text-xl lg:text-[22px] xl:text-[30px]",
            )}
          >
            {getTruncatedTitle(displayQuery, titleCharCount)}
          </h1>

          {/* Download button placeholder - matches HeaderTitle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                className="focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                <Button
                  disabled
                  aria-label="Download options (disabled)"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "bg-accent flex items-center justify-center rounded-md opacity-50 shadow-sm",
                    "h-6 min-h-6 w-6 min-w-6 p-1",
                    "md:h-7 md:min-h-7 md:w-7 md:min-w-7",
                    "lg:h-9 lg:min-h-9 lg:w-9 lg:min-w-9 lg:p-2",
                    "xl:h-12 xl:min-h-12 xl:w-12 xl:min-w-12 xl:p-3",
                  )}
                >
                  <Image
                    src={"/agents/edit.svg"}
                    alt={"Download"}
                    width={24}
                    height={24}
                    className="h-full w-full object-contain"
                  />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Available after research completes</TooltipContent>
          </Tooltip>
        </div>

        {/* Tab Panel - Matches TabsPanel */}
        <div className="border-border mb-2 w-full border-b">
          <Tabs value={selectedTab} onValueChange={handleTabChange}>
            <TabsList
              className={cn(
                "h-[46px] min-h-[46px] w-fit justify-start rounded-none border-b-0 bg-transparent p-0",
                "md:min-h-[56px]",
              )}
            >
              {/* Research Tab */}
              <TabsTrigger
                value="0"
                className={cn(
                  "text-muted-foreground hover:text-primary relative mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-3 py-0 text-[10px] font-normal transition-none hover:opacity-80",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                  "md:px-4 md:py-1 md:text-xs",
                  "lg:px-3.5 lg:py-1.5 lg:text-xs",
                  "xl:px-5 xl:py-3 xl:text-sm",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                    <Image
                      src={
                        selectedTab === "0"
                          ? "/agents/ans-active.svg"
                          : "/agents/ans.svg"
                      }
                      alt="Research"
                      fill
                    />
                  </div>
                  <span>Research</span>
                </div>
              </TabsTrigger>

              {/* Images Tab */}
              <TabsTrigger
                value="1"
                className={cn(
                  "text-muted-foreground hover:text-primary relative mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-3 py-0 text-[10px] font-normal transition-none hover:opacity-80",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                  "md:px-4 md:py-1 md:text-xs",
                  "lg:px-3.5 lg:py-1.5 lg:text-xs",
                  "xl:px-5 xl:py-3 xl:text-sm",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                    <Image
                      src={
                        selectedTab === "1"
                          ? "/agents/img-active.svg"
                          : "/agents/img.svg"
                      }
                      alt="Images"
                      fill
                    />
                  </div>
                  <div className="relative">
                    <span>Images</span>
                    {imageCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1 h-4 min-w-4 px-1 text-[0.6rem]"
                      >
                        {imageCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsTrigger>

              {/* Sources Tab */}
              <TabsTrigger
                value="2"
                className={cn(
                  "text-muted-foreground hover:text-primary relative mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-3 py-0 text-[10px] font-normal transition-none hover:opacity-80",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                  "md:px-4 md:py-1 md:text-xs",
                  "lg:px-3.5 lg:py-1.5 lg:text-xs",
                  "xl:px-5 xl:py-3 xl:text-sm",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                    <Image
                      src={
                        selectedTab === "2"
                          ? "/agents/sources-active.svg"
                          : "/agents/sources.svg"
                      }
                      alt="Sources"
                      fill
                    />
                  </div>
                  <div className="relative">
                    <span>Sources</span>
                    {sourceCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1 h-4 min-w-4 px-1 text-[0.6rem]"
                      >
                        {sourceCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Research Process Timeline */}
      {streamEvents.length > 0 && (
        <ResearchProcessLogs
          streamEvents={streamEvents}
          researches={[]}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
};

export default ResearchStreamingShell;
