"use client";

import { cn } from "@/lib/utils";
import {
  Bot,
  ChevronDown,
  Globe,
  MousePointer2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { type ReactNode, useState } from "react";

export interface ToolCallEntry {
  tool_name: string;
  tool_category: string;
  message?: string;
  show_category?: boolean;
  inputs?: Record<string, unknown>;
  output?: string;
  icon_url?: string;
  agent_name?: string;
  status?: "progress" | "success" | "error";
}

export interface ToolCallsSectionProps {
  toolCalls: ToolCallEntry[];
  maxIconsToShow?: number;
  defaultExpanded?: boolean;
  className?: string;
  iconSize?: number;
  onToolClick?: (call: ToolCallEntry) => void;
}

function getAgentIcon(agentName?: string, category?: string) {
  if (agentName === "browser_agent") return MousePointer2;
  if (agentName === "planner_agent") return Sparkles;
  if (category === "search" || category === "web") return Globe;
  return Bot;
}

export function ToolCallsSection({
  toolCalls,
  maxIconsToShow = 10,
  defaultExpanded = false,
  className,
  iconSize = 20,
  onToolClick,
}: ToolCallsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set());

  const toggleCallExpansion = (index: number) => {
    setExpandedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (toolCalls.length === 0) return null;

  const renderStackedIcons = () => {
    const seenCategories = new Set<string>();
    const uniqueIcons = toolCalls.filter((call) => {
      const key = call.agent_name || call.tool_category || "general";
      if (seenCategories.has(key)) return false;
      seenCategories.add(key);
      return true;
    });
    const displayIcons = uniqueIcons.slice(0, maxIconsToShow);

    return (
      <div className="flex min-h-8 items-center -space-x-2">
        {displayIcons.map((call, index) => {
          const Icon = getAgentIcon(call.agent_name, call.tool_category);
          return (
            <div
              key={`${call.tool_name}-${index}`}
              className="bg-primary/10 text-primary relative flex size-8 min-h-8 min-w-8 items-center justify-center rounded-lg"
              style={{
                rotate:
                  displayIcons.length > 1
                    ? index % 2 === 0
                      ? "8deg"
                      : "-8deg"
                    : "0deg",
                zIndex: index,
              }}
            >
              <Icon size={iconSize - 4} />
            </div>
          );
        })}
        {uniqueIcons.length > maxIconsToShow && (
          <div className="bg-muted text-muted-foreground z-0 flex size-7 min-h-7 min-w-7 items-center justify-center rounded-lg text-xs font-normal">
            +{uniqueIcons.length - maxIconsToShow}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("w-fit max-w-[35rem]", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-2 py-2"
      >
        {renderStackedIcons()}
        <span className="text-xs font-medium transition-all duration-200">
          Used {toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "transition-transform duration-200",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-0 pt-1">
          {toolCalls.map((call, index) => {
            const hasCategoryText =
              call.show_category !== false &&
              call.tool_category &&
              call.tool_category !== "unknown";
            const hasDetails = call.inputs || call.output;
            const isCallExpanded = expandedCalls.has(index);
            const Icon = getAgentIcon(call.agent_name, call.tool_category);

            return (
              <div
                key={`${call.tool_name}-step-${index}`}
                className="flex items-stretch gap-2"
              >
                <div className="flex flex-col items-center self-stretch">
                  <div
                    className="bg-primary/10 text-primary flex shrink-0 items-center justify-center rounded-lg p-1.5"
                    style={{ minHeight: 32, minWidth: 32 }}
                  >
                    <Icon size={iconSize - 4} />
                  </div>
                  {index < toolCalls.length - 1 && (
                    <div className="bg-border min-h-4 w-px flex-1" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className={cn(
                      "group/parent flex items-center gap-1",
                      hasDetails || onToolClick ? "cursor-pointer" : "",
                      !hasCategoryText ? "pt-2" : "",
                    )}
                    onClick={() => {
                      if (onToolClick) onToolClick(call);
                      else if (hasDetails) toggleCallExpansion(index);
                    }}
                  >
                    <p
                      className={cn(
                        "text-muted-foreground text-xs font-medium",
                        (hasDetails || onToolClick) &&
                          "group-hover/parent:text-foreground",
                      )}
                    >
                      {call.message ||
                        call.tool_name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    {hasDetails && !onToolClick && (
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-200",
                          isCallExpanded && "rotate-180",
                        )}
                      />
                    )}
                  </button>

                  {hasCategoryText && (
                    <p className="text-muted-foreground/60 text-[11px] capitalize">
                      {call.tool_category
                        .replace(/_/g, " ")
                        .split(" ")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                        )
                        .join(" ")}
                    </p>
                  )}

                  {isCallExpanded && hasDetails && (
                    <div className="bg-muted mb-3 mt-2 w-fit space-y-2 rounded-xl p-3 text-[11px]">
                      {call.inputs && Object.keys(call.inputs).length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 font-medium">
                            Input
                          </span>
                          <pre className="text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(call.inputs, null, 2)}
                          </pre>
                        </div>
                      )}
                      {call.output && (
                        <div className="flex flex-col">
                          <span className="text-muted-foreground mb-1 font-medium">
                            Output
                          </span>
                          <pre className="text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
                            {call.output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ToolCallsSection;
