"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function TabsPanel({
  selectedTab,
  sources,
  images,
  onTabChange,
}) {
  const handleChange = (newValue) => {
    onTabChange(Number(newValue));
  };

  // Count unique sources
  const uniqueSourcesCount = sources
    ? sources.filter(
        (source, index, self) =>
          index === self.findIndex((s) => s.url === source.url),
      ).length
    : 0;

  const imagesCount = images ? images.length : 0;

  // Helper: choose icon variant based on tab state
  const getIconSrc = (base, activeBase, isActive) => {
    if (isActive) return activeBase; // use active icon
    return `${base}.svg`;
  };

  return (
    <div className="border-border w-full border-b">
      <div className="w-fit">
        <Tabs value={String(selectedTab)} onValueChange={handleChange}>
          <TabsList
            className={cn(
              "h-[46px] min-h-[46px] w-full justify-start rounded-none border-b-0 bg-transparent p-0",
              "md:min-h-[56px]",
            )}
          >
            {/* Research */}
            <TabsTrigger
              value="0"
              className={cn(
                "text-muted-foreground hover:text-primary relative mr-1.5 sm:mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-2 py-0 text-[10px] font-normal transition-none hover:opacity-80 sm:px-3",
                "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                "md:px-4 md:py-1 md:text-xs",
                "lg:px-3.5 lg:py-1.5 lg:text-xs",
                "xl:px-5 xl:py-3 xl:text-sm",
              )}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                  <Image
                    src={getIconSrc(
                      "/agents/ans",
                      "/agents/ans-active.svg",
                      selectedTab === 0,
                    )}
                    alt="Research"
                    fill
                  />
                </div>
                <span>Research</span>
              </div>
            </TabsTrigger>

            {/* Images */}
            <TabsTrigger
              value="1"
              className={cn(
                "text-muted-foreground hover:text-primary relative mr-1.5 sm:mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-2 py-0 text-[10px] font-normal transition-none hover:opacity-80 sm:px-3",
                "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                "md:px-4 md:py-1 md:text-xs",
                "lg:px-3.5 lg:py-1.5 lg:text-xs",
                "xl:px-5 xl:py-3 xl:text-sm",
              )}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                  <Image
                    src={getIconSrc(
                      "/agents/img",
                      "/agents/img-active.svg",
                      selectedTab === 1,
                    )}
                    alt="Images"
                    fill
                  />
                </div>
                <div className="relative">
                  <span>Images</span>
                  {imagesCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-1 h-4 min-w-4 px-1 text-[0.6rem]"
                    >
                      {imagesCount}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsTrigger>

            {/* Sources */}
            <TabsTrigger
              value="2"
              className={cn(
                "text-muted-foreground hover:text-primary relative mr-1.5 sm:mr-2.5 min-w-0 rounded-none border-x-0 border-t-0 border-b-[3px] border-transparent bg-transparent px-2 py-0 text-[10px] font-normal transition-none hover:opacity-80 sm:px-3",
                "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:shadow-none",
                "md:px-4 md:py-1 md:text-xs",
                "lg:px-3.5 lg:py-1.5 lg:text-xs",
                "xl:px-5 xl:py-3 xl:text-sm",
              )}
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="relative h-5 w-5 lg:h-[22px] lg:w-[22px] xl:h-7 xl:w-7">
                  <Image
                    src={getIconSrc(
                      "/agents/sources",
                      "/agents/sources-active.svg",
                      selectedTab === 2,
                    )}
                    alt="Sources"
                    fill
                  />
                </div>
                <div className="relative">
                  <span>Sources</span>
                  {uniqueSourcesCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-1 h-4 min-w-4 px-1 text-[0.6rem]"
                    >
                      {uniqueSourcesCount}
                    </Badge>
                  )}
                </div>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
