"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState } from "react";
import TutorialSection from "./TutorialSection";

const ToolCategorySection = ({
  title,
  toolsData,
  subscriberCount,
  loading,
  handleSubscribe,
  formatSubscriberCount,
  defaultTab
}) => {
  const [currentTab, setCurrentTab] = useState(defaultTab || Object.keys(toolsData)[0]);

  const handleVideoClick = (videoId) => {
    // Optional: Analytics tracking here
  };

  return (
    <div className="space-y-8 py-12">
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <div className="mx-auto h-1 w-20 rounded-full bg-primary/20" />
      </div>
      
      <Tabs
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <div className="mb-8 flex justify-center">
             <TabsList className="bg-muted/50 inline-flex h-auto w-auto flex-wrap justify-center overflow-visible rounded-full p-2">
            {Object.entries(toolsData).map(([key, tool]) => (
              <TabsTrigger
                key={key}
                value={key}
                className={cn(
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm flex items-center gap-2 rounded-full px-6 py-2.5 font-medium transition-all",
                  "hover:bg-background/50 hover:text-foreground/80",
                  "data-[state=active]:scale-105"
                )}
              >
                  <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    tool.iconColor ? `text-[${tool.iconColor}]` : ""
                  )}
                  style={tool.iconColor ? { color: tool.iconColor } : {}}
                >
                  {tool.icon}
                </span>
                {tool.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
       

        {Object.entries(toolsData).map(([key, tool]) => (
          <TabsContent key={key} value={key} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <TutorialSection
              tool={tool}
              onVideoClick={handleVideoClick}
              subscriberCount={subscriberCount}
              loading={loading}
              handleSubscribe={handleSubscribe}
              formatSubscriberCount={formatSubscriberCount}
            />
          </TabsContent>
        ))}
      </Tabs>
      
    </div>
  );
};

export default ToolCategorySection;
