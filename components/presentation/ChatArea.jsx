"use client";

// components/ChatArea.tsx
import InteractiveChatMessage from "@/components/agents/shared/InteractiveChatMessage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import useResponsive from "@/hooks/ui/useResponsive";
import {
  formatAgentName,
  formatTimestamp,
  useStreamingLogs,
} from "@/hooks/useStreamingLogs";
import { cn } from "@/lib/utils";
import { Bot, Palette, Presentation, Search, User } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import TypingAnimation from "../common/TypingAnimation";
import { FooterCta } from "../sheet/SheetAgentPage";
import InputArea from "./InputAreas";

// UTILS function
// Parse tool outputs from markdown code blocks
const parseToolOutputs = (text) => {
  const toolOutputsMatch = text.match(/```tool_outputs\n(.*?)\n```/s);
  if (!toolOutputsMatch) return null;

  try {
    // Clean up the string and parse as JSON
    const cleanedJson = toolOutputsMatch[1].replace(/'/g, '"');
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.warn("Failed to parse tool outputs:", error);
    return null;
  }
};

// --- Sub-components for Structured Data ---

// Component for Tool Outputs logs
const ToolOutputsLog = memo(({ toolOutputs, statusText }) => (
  <Card className={cn("border-border mt-1 rounded-lg")}>
    <CardContent className="p-4">
      <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
        Tool Outputs
      </h3>
      {toolOutputs && (
        <div className="mb-2">
          <div className="mb-2 flex items-center gap-1">
            <Palette className="text-muted-foreground h-4 w-4" />
            <span className="text-base font-medium">Theme Configuration</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(toolOutputs).map(([key, value]) => (
              <div key={key} className="flex items-center gap-1">
                {key.includes("color") && (
                  <div
                    className="border-border h-4 w-4 rounded border"
                    style={{ backgroundColor: value }}
                  />
                )}
                <span className="text-muted-foreground text-xs">{`${key.replace(
                  /_/g,
                  " ",
                )}: `}</span>
                <span className="text-xs font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {statusText && (
        <div className="bg-muted mt-2 rounded p-2">
          <p className="text-sm whitespace-pre-wrap">{statusText}</p>
        </div>
      )}
    </CardContent>
  </Card>
));
ToolOutputsLog.displayName = "ToolOutputsLog";

// Component for Keyword Research logs
const KeywordResearchLog = memo(({ queries }) => (
  <Card className={cn("border-border mt-1 rounded-lg")}>
    <CardContent className="p-4">
      <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
        Search Queries
      </h3>
      <ul className="space-y-1">
        {queries.map((query, i) => (
          <li key={i} className="flex items-center gap-2 py-0.5">
            <Search className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-sm">{query}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
));
KeywordResearchLog.displayName = "KeywordResearchLog";

// Component for Presentation Plan logs
// Utility to check if a value is a non-empty object
const isNonEmptyObject = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length > 0;

// Utility to check if a value is a string
const isString = (value) => typeof value === "string";

// Utility to check if a value is a non-empty array
const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

// Component for Presentation Plan logs
const PlanningLog = memo(({ plan }) => {
  if (!isNonEmptyObject(plan)) {
    return (
      <Card className={cn("border-border mt-1 rounded-lg")}>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-bold">Presentation Plan</h2>
          <p className="text-destructive text-sm">
            Empty presentation plan data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Check if global_theme has the expected direct properties (e.g., primary_color, header_font)
  const hasDirectThemeProperties =
    isNonEmptyObject(plan.global_theme) &&
    Object.keys(plan.global_theme).some((key) =>
      [
        "primary_color",
        "secondary_color",
        "background_color",
        "text_color",
        "accent_color",
        "header_font",
        "body_font",
      ].includes(key),
    );

  return (
    <Card className={cn("border-border mt-1 rounded-lg")}>
      <CardContent className="p-4">
        <h2 className="mb-2 text-lg font-bold">Presentation Plan</h2>
        {hasDirectThemeProperties && (
          <div className="mb-2">
            <div className="mb-2 flex items-center gap-1">
              <Palette className="text-muted-foreground h-4 w-4" />
              <span className="text-base font-medium">Global Theme</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(plan.global_theme).map(([key, value]) => {
                // Convert value to string safely
                const displayValue =
                  typeof value === "string"
                    ? value
                    : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value);

                return (
                  <div key={key} className="flex items-center gap-1">
                    {key.includes("color") &&
                      typeof value === "string" &&
                      value.startsWith("#") && (
                        <div
                          className="border-border h-4 w-4 rounded border"
                          style={{ backgroundColor: value }}
                        />
                      )}
                    <span className="text-xs">{`${key.replace(/_/g, " ")}: `}</span>
                    <span className="text-xs font-bold">{displayValue}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {isNonEmptyArray(plan.slides) && (
          <div>
            <div className="mt-2 mb-2 flex items-center gap-1">
              <Presentation className="text-muted-foreground h-4 w-4" />
              <span className="text-base font-medium">Planned Slides</span>
            </div>
            <div className="flex flex-col gap-2">
              {plan.slides.map((slide, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4">
                    <p className="text-base font-semibold">
                      {isNonEmptyObject(slide.slide_data) &&
                      isString(slide.slide_data.headline)
                        ? slide.slide_data.headline
                        : "Untitled Slide"}
                    </p>
                    <p className="text-muted-foreground mb-1 text-sm">
                      {isNonEmptyObject(slide.slide_data) &&
                      isString(slide.slide_data.body_content)
                        ? `${slide.slide_data.body_content.substring(0, 100)}...`
                        : "No content available"}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {isString(slide.slide_type)
                        ? slide.slide_type
                        : "Unknown"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {!hasDirectThemeProperties && !plan.slides && (
          <p className="text-muted-foreground text-sm">
            No valid theme or slides data available.
          </p>
        )}
      </CardContent>
    </Card>
  );
});
PlanningLog.displayName = "PlanningLog";

// Component for rendering HTML content in a sandboxed iframe
const HtmlContentLog = memo(({ htmlString }) => (
  <div className="border-border mt-1 h-[400px] resize-y overflow-auto rounded border">
    <iframe
      srcDoc={htmlString}
      title="Generated Slide Preview"
      sandbox="allow-scripts"
      className="h-full w-full border-0"
    />
  </div>
));
HtmlContentLog.displayName = "HtmlContentLog";

// Generic fallback for unknown object structures
const JsonLog = memo(({ data }) => (
  <div className="bg-muted mt-1 max-h-[300px] overflow-y-auto rounded-lg p-2">
    <pre className="m-0 text-xs break-all whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
));
JsonLog.displayName = "JsonLog";

// --- NEW: User Message Component ---
const UserMessage = memo(({ message, timestamp }) => (
  <div className="mb-3 flex justify-end">
    <div className="max-w-[80%]">
      <div className="mb-1 flex items-center justify-end gap-1 opacity-70">
        <span className="text-muted-foreground text-[0.7rem]">
          {formatTimestamp(timestamp)}
        </span>
        <span className="text-muted-foreground text-[0.75rem] font-medium">
          You
        </span>
        <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <User className="text-primary-foreground h-3 w-3" />
        </div>
      </div>
      <div className="bg-primary text-primary-foreground max-w-full rounded-[18px_18px_4px_18px] px-2 py-1.5 break-words">
        <p className="text-[0.95rem] leading-[1.5]">{message}</p>
      </div>
    </div>
  </div>
));
UserMessage.displayName = "UserMessage";

// --- Main Components ---

// Component for Slide Data Fetcher Tool logs
const SlideDataFetcherLog = memo(({ data }) => {
  const { original_plan, global_theme } = data;

  return (
    <div className="mt-2 mb-1">
      <Card
        className={cn(
          "border-border bg-card hover:border-border overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md",
        )}
      >
        {/* Header */}
        <div
          className="text-primary-foreground relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700 p-4 sm:p-5"
          style={{
            "--pattern": `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "var(--pattern)",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="relative z-10 flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Presentation className="text-primary-foreground h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base leading-tight font-semibold sm:text-lg">
                Slide Data Fetcher
              </h3>
              <p className="text-sm font-normal opacity-90">
                Preparing slide content and theme
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          {/* Global Theme Section */}
          {global_theme && (
            <div className="mb-3">
              <h3 className="text-foreground mb-2 flex items-center gap-1 text-base font-semibold">
                <div className="bg-muted flex h-5 w-5 items-center justify-center rounded">
                  <Palette className="text-muted-foreground h-3 w-3" />
                </div>
                Theme Configuration
              </h3>

              {/* Extract color properties from global_theme */}
              {(() => {
                const colorKeys = [
                  "primary_color",
                  "secondary_color",
                  "background_color",
                  "text_color",
                  "highlight_color",
                ];
                const colors = {};
                colorKeys.forEach((key) => {
                  if (global_theme[key]) {
                    colors[key] = global_theme[key];
                  }
                });

                return (
                  Object.keys(colors).length > 0 && (
                    <div className="mb-2.5">
                      <p className="text-foreground mb-1.5 font-medium">
                        Color Palette
                      </p>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                        {Object.entries(colors).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-muted border-border hover:bg-muted/80 flex items-center gap-1 rounded-lg border p-1.5 transition-all duration-200 hover:-translate-y-px"
                          >
                            <div
                              className="border-card h-5 w-5 shrink-0 rounded-md border-2 shadow-sm"
                              style={{ backgroundColor: value }}
                            />
                            <div className="min-w-0">
                              <span className="text-muted-foreground text-xs font-medium capitalize">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-foreground block font-mono text-xs font-semibold">
                                {value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}

              {/* Extract font properties from global_theme */}
              {(() => {
                const fontKeys = ["header_font", "body_font"];
                const fonts = {};
                fontKeys.forEach((key) => {
                  if (global_theme[key]) {
                    fonts[key] = global_theme[key];
                  }
                });

                return (
                  Object.keys(fonts).length > 0 && (
                    <div>
                      <p className="text-foreground mb-1.5 font-medium">
                        Typography
                      </p>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                        {Object.entries(fonts).map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-muted border-border rounded-lg border p-1.5"
                          >
                            <span className="text-muted-foreground text-xs font-medium capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <p
                              className="text-foreground mt-0.5 text-sm font-medium"
                              style={{ fontFamily: value }}
                            >
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                );
              })()}
            </div>
          )}

          {/* Slide Plan Section */}
          {original_plan && (
            <div>
              <h3 className="text-foreground mb-2 flex items-center gap-1 text-base font-semibold">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-50">
                  <Presentation className="h-3 w-3 text-blue-600" />
                </div>
                Slide Blueprint
              </h3>

              <Card className="overflow-hidden rounded-xl border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-2 flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-center">
                    <h3 className="text-foreground text-base leading-tight font-semibold sm:text-lg">
                      {original_plan.slide_data?.headline || "Untitled Slide"}
                    </h3>
                    <Badge className="text-primary-foreground h-7 bg-blue-600 px-1.5 font-medium">
                      {original_plan.slide_type}
                    </Badge>
                  </div>

                  {/* Visual Suggestion */}
                  {original_plan.visual_suggestion && (
                    <div className="mb-2.5 rounded-lg border border-blue-200 bg-blue-100/50 p-2">
                      <p className="mb-0.5 text-sm font-semibold text-blue-900">
                        📊 {original_plan.visual_suggestion.chart_type}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {original_plan.visual_suggestion.highlight}
                      </p>
                    </div>
                  )}

                  {/* Data Points */}
                  {original_plan.slide_data?.body_content &&
                    Array.isArray(original_plan.slide_data.body_content) && (
                      <div>
                        <p className="text-foreground mb-1.5 text-sm font-semibold">
                          Data Points
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {original_plan.slide_data.body_content.map(
                            (item, index) => (
                              <Badge
                                key={index}
                                variant="outlined"
                                className="border-border text-muted-foreground bg-card hover:bg-muted hover:border-border"
                              >
                                {typeof item === "object"
                                  ? `${item.label}: ${item.value}`
                                  : item}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
SlideDataFetcherLog.displayName = "SlideDataFetcherLog";

// Modern Responsive PlanModifierLog Component
const PlanModifierLog = memo(({ data }) => {
  return (
    <div className="mt-2 mb-1">
      <Card
        className={cn(
          "border-border bg-card hover:border-border overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md",
        )}
      >
        {/* Header */}
        <div
          className="text-primary-foreground relative overflow-hidden bg-gradient-to-br from-amber-500 to-amber-600 p-4 sm:p-5"
          style={{
            "--pattern": `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0-8.837-7.163-16-16-16S-12 11.163-12 20s7.163 16 16 16 16-7.163 16-16zm0 0c0 8.837 7.163 16 16 16s16-7.163 16-16-7.163-16-16-16-16 7.163-16 16z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "var(--pattern)",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="relative z-10 flex items-center gap-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <Palette className="text-primary-foreground h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base leading-tight font-semibold sm:text-lg">
                Plan Modifier
              </h3>
              <p className="text-sm font-normal opacity-90">
                Customizing slide content
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          <Card className="overflow-hidden rounded-xl border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-2 flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-center">
                <h3 className="text-base leading-tight font-semibold text-amber-900 sm:text-lg">
                  {data.slide_data?.headline || "Modified Slide"}
                </h3>
                <Badge className="text-primary-foreground h-7 bg-amber-500 px-1.5 font-medium">
                  {data.slide_type}
                </Badge>
              </div>

              {/* Visual Suggestion */}
              {data.visual_suggestion && (
                <div className="mb-2.5 rounded-lg border border-amber-200 bg-amber-100/50 p-2">
                  <p className="mb-0.5 text-sm font-semibold text-amber-900">
                    📈 {data.visual_suggestion.chart_type}
                  </p>
                  <p className="text-sm leading-relaxed text-amber-800">
                    {data.visual_suggestion.highlight}
                  </p>
                </div>
              )}

              {/* Modified Data Points */}
              {data.slide_data?.body_content &&
                Array.isArray(data.slide_data.body_content) && (
                  <div>
                    <p className="text-foreground mb-1.5 text-sm font-semibold">
                      Modified Content
                    </p>
                    <div className="flex flex-col gap-1">
                      {data.slide_data.body_content.map((item, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-amber-200 bg-white/70 p-1.5 font-mono text-xs transition-all duration-200 hover:-translate-y-px hover:bg-white/90"
                        >
                          <p className="font-inherit text-foreground break-words whitespace-pre-wrap">
                            {typeof item === "string"
                              ? item
                              : JSON.stringify(item, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
});

PlanModifierLog.displayName = "PlanModifierLog";

const StreamingMessage = memo(
  ({
    log,
    isTyping,
    onTypingComplete,
    logIndex,
    registerAnimationCallback,
    unregisterAnimationCallback,
    sessionStatus,
    processedLogs,
  }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(!isTyping);
    const animationStateRef = useRef({
      isRunning: false,
      intervalId: null,
      forceCompleted: false,
    });
    const mountedRef = useRef(true);

    const isStringContent = typeof log.parsed_output === "string";
    const fullText = isStringContent ? log.parsed_output : "";
    const isHtmlContent =
      isStringContent && fullText.trim().startsWith("<!DOCTYPE html>");

    const isToolOutputContent =
      isStringContent && fullText.includes("```tool_outputs");

    // Don't animate if the session is finished. This prevents re-animation on page revisit.
    const isSessionActive =
      sessionStatus !== "completed" &&
      sessionStatus !== "failed" &&
      sessionStatus !== "saved";
    const shouldAnimate =
      isStringContent &&
      !isHtmlContent &&
      !isToolOutputContent &&
      log.shouldAnimate !== false &&
      isTyping &&
      isSessionActive &&
      sessionStatus === "processing" &&
      logIndex >= processedLogs.length - 2;

    const prepareWords = useCallback((text) => {
      if (!text) return [];
      const parts = text.split(/(\s+)/);
      const words = [];
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].trim()) words.push({ text: parts[i], isSpace: false });
        else if (parts[i]) words.push({ text: parts[i], isSpace: true });
      }
      return words;
    }, []);

    const forceComplete = useCallback(() => {
      const state = animationStateRef.current;
      if (!state.isRunning || state.forceCompleted) return;

      state.forceCompleted = true;
      state.isRunning = false;
      if (state.intervalId) clearInterval(state.intervalId);

      if (mountedRef.current) {
        setDisplayedText(fullText);
        setIsComplete(true);
        setTimeout(() => {
          if (mountedRef.current) {
            unregisterAnimationCallback(logIndex);
            onTypingComplete?.(logIndex);
          }
        }, 50);
      }
    }, [fullText, logIndex, onTypingComplete, unregisterAnimationCallback]);

    useEffect(() => {
      mountedRef.current = true;
      return () => {
        mountedRef.current = false;
        if (animationStateRef.current.intervalId)
          clearInterval(animationStateRef.current.intervalId);
      };
    }, []);

    useEffect(() => {
      if (!shouldAnimate) {
        if (isStringContent) setDisplayedText(fullText);
        setIsComplete(true);
        if (animationStateRef.current.intervalId)
          clearInterval(animationStateRef.current.intervalId);
        animationStateRef.current.isRunning = false;
        return;
      }

      setDisplayedText("");
      setIsComplete(false);
      if (animationStateRef.current.intervalId)
        clearInterval(animationStateRef.current.intervalId);
      animationStateRef.current = {
        isRunning: false,
        intervalId: null,
        forceCompleted: false,
      };
    }, [shouldAnimate, fullText, isStringContent]);

    useEffect(() => {
      if (
        !shouldAnimate ||
        !fullText.trim() ||
        animationStateRef.current.isRunning
      ) {
        if (!fullText.trim() && shouldAnimate) {
          setIsComplete(true);
          onTypingComplete?.(logIndex);
        }
        return;
      }

      const state = animationStateRef.current;
      const words = prepareWords(fullText);
      if (words.length === 0) {
        setIsComplete(true);
        onTypingComplete?.(logIndex);
        return;
      }

      state.isRunning = true;
      registerAnimationCallback(logIndex, forceComplete);

      let currentWordIndex = 0;
      const animateWords = () => {
        if (!mountedRef.current || !state.isRunning || state.forceCompleted)
          return;

        if (currentWordIndex < words.length) {
          const currentWords = words.slice(0, currentWordIndex + 1);
          setDisplayedText(currentWords.map((w) => w.text).join(""));
          currentWordIndex++;
        } else {
          state.isRunning = false;
          clearInterval(state.intervalId);
          state.intervalId = null;
          setIsComplete(true);
          setTimeout(() => {
            if (mountedRef.current && !state.forceCompleted) {
              unregisterAnimationCallback(logIndex);
              onTypingComplete?.(logIndex);
            }
          }, 50);
        }
      };

      const wordDelay = Math.max(30, 80 - Math.floor(words.length / 10));
      state.intervalId = setInterval(animateWords, wordDelay);

      return () => {
        state.isRunning = false;
        if (state.intervalId) clearInterval(state.intervalId);
        unregisterAnimationCallback(logIndex);
      };
    }, [
      fullText,
      shouldAnimate,
      onTypingComplete,
      logIndex,
      registerAnimationCallback,
      unregisterAnimationCallback,
      forceComplete,
      prepareWords,
    ]);

    const renderContent = () => {
      if (log.agent_name === "unknown_agent" && isStringContent) {
        const shouldSkip = fullText.includes("```tool_outputs"); // TODO: Have to add json formatter here

        if (shouldSkip) return null;
      }

      const output = log.parsed_output;
      if (typeof output === "object" && output !== null) {
        switch (log.agent_name) {
          case "keyword_research_agent":
            return <KeywordResearchLog queries={output.search_queries || []} />;
          case "planning_agent":
            return <PlanningLog plan={output} />;
          case "slide_data_fetcher_tool":
            return <SlideDataFetcherLog data={output} />;
          case "plan_modifier_agent":
            return <PlanModifierLog data={output} />;
          default:
            return <JsonLog data={output} />;
        }
      }

      if (isHtmlContent) {
        return <HtmlContentLog htmlString={fullText} />;
      }

      // Handle tool outputs in string content
      if (typeof output === "string" && output.includes("```tool_outputs")) {
        const toolOutputs = parseToolOutputs(output);
        const statusText = output
          .replace(/```tool_outputs\n.*?\n```\n?/s, "")
          .trim();

        if (toolOutputs) {
          return (
            <ToolOutputsLog toolOutputs={toolOutputs} statusText={statusText} />
          );
        }
      }

      return (
        <p className="text-foreground text-[0.95rem] leading-relaxed break-words whitespace-pre-wrap">
          {displayedText}
          {shouldAnimate && !isComplete && (
            <span className="bg-primary ml-0.5 inline-block h-5 w-[2px] animate-pulse" />
          )}
        </p>
      );
    };

    return (
      <div className="mb-3">
        <div className="mb-1.5 flex items-center gap-1 opacity-70">
          <div className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
            AI
          </div>
          <span className="text-foreground text-[0.75rem] font-medium">
            {formatAgentName(log.agent_name)}
          </span>
          <span className="text-muted-foreground text-[0.7rem]">
            {formatTimestamp(log.timestamp)}
          </span>
        </div>
        <div className="ml-0">{renderContent()}</div>
      </div>
    );
  },
);
StreamingMessage.displayName = "StreamingMessage";

// const mergeMessagesWithDeduplication = (realLogs, optimisticMessages) => {
//   const merged = [...realLogs];

//   optimisticMessages.forEach((optMsg) => {
//     const exists = realLogs.some(
//       (real) =>
//         real.role === "user" && real.message?.trim() === optMsg.message?.trim()
//     );

//     if (!exists) {
//       merged.push(optMsg);
//     }
//   });

//   return merged.sort(
//     (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//   );
// };

const mergeMessagesWithDeduplication = (realLogs, optimisticMessages) => {
  // Preserve agent logs from realLogs
  const agentLogs = realLogs.filter((log) => log.role === "agent");

  const merged = [...realLogs];

  optimisticMessages.forEach((optMsg) => {
    const exists = realLogs.some(
      (real) =>
        real.role === "user" && real.message?.trim() === optMsg.message?.trim(),
    );

    if (!exists) {
      merged.push(optMsg);
    }
  });

  // 

  return merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
};

export default function ChatArea({
  currentAgentType,
  chatHistory,
  realLogs,
  isLoading,
  currentPhase,
  completedPhases,
  logsData,
  chatEndRef,
  inputValue,
  setInputValue,
  onSend,
  status,
  presentationId,
  optimisticMessages = [],
  setUploadedFiles,
  setFileUrls,
  uploadedFiles,
  fileUrls,
  hideInputField, // for simulation it's true, for regular process it's false. based on this we can also add the CTA footer.
  simulationCompleted,
  setShowModal,
  showModal,

  // these are for preview panel on mobile devices
  handlePreviewOpen = () => {}, // onclick handler to open the preview panel
  slides = [], // slides data to show on the preview panel
}) {
  const isMobile = useResponsive("down", "lg");

  const {
    processedLogs,
    currentlyTypingIndex,
    showThinking,
    handleTypingComplete,
    sessionStatus,
    isBackgroundProcessing,
    registerAnimationCallback,
    unregisterAnimationCallback,
  } = useStreamingLogs(realLogs, isLoading, status, presentationId);

  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(true);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (chatEndRef.current && autoScrollRef.current) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior, block: "end" });
      });
    }
  }, []);

  const checkScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      autoScrollRef.current = scrollTop + clientHeight >= scrollHeight - 100;
    }
  }, []);

  useEffect(() => {
    if (processedLogs.length !== 0 || showThinking) {
      scrollToBottom();
    }
  }, [processedLogs.length, showThinking, scrollToBottom]);

  useEffect(() => {
    if (currentlyTypingIndex >= 0) {
      const scrollInterval = setInterval(() => {
        if (autoScrollRef.current) scrollToBottom("auto");
      }, 200);
      return () => clearInterval(scrollInterval);
    }
  }, [currentlyTypingIndex, scrollToBottom]);

  const deduplicatedOptimisticMessages = useMemo(() => {
    return optimisticMessages.filter(
      (optMsg) =>
        !realLogs.some(
          (log) =>
            log.message === optMsg.message &&
            Math.abs(new Date(log.timestamp) - new Date(optMsg.timestamp)) <
              5000,
        ),
    );
  }, [realLogs, optimisticMessages]);

  const allMessages = useMemo(() => {
    return mergeMessagesWithDeduplication(
      realLogs,
      deduplicatedOptimisticMessages,
    );
  }, [realLogs, deduplicatedOptimisticMessages]);

  return (
    <>
      <div className="border-border bg-background flex h-full max-h-full flex-col overflow-hidden border-r">
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth [scrollbar-color:rgb(var(--muted-foreground)_/_0.3)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex min-h-full flex-col p-3">
            {chatHistory.length === 0 &&
              allMessages.length === 0 &&
              !showThinking && (
                <div className="flex min-h-[300px] flex-1 flex-col justify-center text-center">
                  <Bot className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                  <h2 className="text-muted-foreground mb-1 text-lg font-semibold">
                    {currentAgentType === "presentation"
                      ? "Presentation Agent"
                      : "Super Agent"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Start a conversation to see AI responses stream in real-time
                  </p>
                </div>
              )}

            {chatHistory.map((message) => (
              <InteractiveChatMessage
                key={message.id}
                message={message}
                onResponse={() => {}}
                onFeedback={() => {}}
                onPreferenceUpdate={() => {}}
              />
            ))}

            {allMessages.map((log, index) => {
              if (log.role === "user") {
                return (
                  <UserMessage
                    key={`user-${log.id || log.timestamp || index}`}
                    message={log.message}
                    timestamp={log.timestamp}
                  />
                );
              } else if (log.role === "agent") {
                const agentIndex = processedLogs.findIndex(
                  (processedLog) => processedLog.timestamp === log.timestamp,
                );

                if (agentIndex >= 0) {
                  return (
                    <StreamingMessage
                      key={processedLogs[agentIndex].id}
                      log={processedLogs[agentIndex]}
                      logIndex={agentIndex}
                      isTyping={agentIndex === currentlyTypingIndex}
                      onTypingComplete={handleTypingComplete}
                      registerAnimationCallback={registerAnimationCallback}
                      unregisterAnimationCallback={unregisterAnimationCallback}
                      sessionStatus={sessionStatus}
                      processedLogs={processedLogs}
                    />
                  );
                }
              }
              return null;
            })}

            {showThinking &&
              sessionStatus !== "completed" &&
              sessionStatus !== "failed" &&
              sessionStatus !== "saved" && (
                <div className="mt-1">
                  <TypingAnimation
                    text={
                      sessionStatus === "failed"
                        ? "Processing failed..."
                        : isLoading
                          ? "Thinking..."
                          : "Processing..."
                    }
                  />
                </div>
              )}

            <div ref={chatEndRef} />
          </div>
        </div>

        <div
          className={cn(
            "border-border bg-card flex max-h-[400px] flex-col justify-center overflow-hidden border-t lg:max-h-[300px]",
          )}
        >
          {/* 
            1. For mobile the preview view panel will be close to chat input box.
            2. For simulation we don't show the input box.
            3. For simulation the preview will be available after the simulation is completed.
           */}
          {/* on mobile preview panel */}
          {isMobile && (
            <div
              className="border-border bg-muted/50 flex cursor-pointer items-center gap-2 border p-2"
              onClick={handlePreviewOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                width="24"
                viewBox="0 0 24 24"
                className="text-primary h-7 w-7"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
              </svg>
              <h3 className="ml-0.5 text-lg font-semibold">Preview Slides</h3>
              {slides.length > 0 && (
                <span className="text-muted-foreground mt-0.5 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                  {slides.length} slide{slides.length > 1 ? "s" : ""} available
                </span>
              )}
            </div>
          )}
          {/* chat input box */}
          <div>
            {!hideInputField && (
              <InputArea
                currentAgentType={currentAgentType}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={onSend}
                isLoading={isLoading}
                setUploadedFiles={setUploadedFiles}
                setFileUrls={setFileUrls}
                uploadedFiles={uploadedFiles}
                fileUrls={fileUrls}
              />
            )}
          </div>
        </div>
      </div>

      {/* for simulation */}
      {hideInputField && simulationCompleted && (
        <FooterCta
          isMobile={isMobile}
          setShowModal={setShowModal}
          showModal={showModal}
        />
      )}
    </>
  );
}
