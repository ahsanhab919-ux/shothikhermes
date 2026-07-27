// hooks/useStaticLogs.ts
import { useState, useEffect, useRef } from "react";
import type { AgentLog, LogHookResult, SessionStatus } from "@/types/logs";

export const useStaticLogs = (
  realLogs: AgentLog[],
  isLoading: boolean,
  status: SessionStatus,
): LogHookResult => {
  const [visibleLogs, setVisibleLogs] = useState<AgentLog[]>([]);
  const sessionStatusRef = useRef<SessionStatus>("processing");

  useEffect(() => {
    sessionStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!realLogs || realLogs.length === 0) {
      setVisibleLogs([]);
      return;
    }

    // Filter and format logs without animation
    const validLogs = realLogs
      .filter((log) => {
        if (!log || !log.parsed_output) return false;
        if (typeof log.parsed_output === "string") {
          return log.parsed_output.trim().length > 0;
        }
        if (typeof log.parsed_output === "object") {
          return Object.keys(log.parsed_output).length > 0;
        }
        return false;
      })
      .filter((log) => log.agent_name !== "browser_agent")
      .map((log, index) => ({
        ...log,
        id: `log-${index}-${log.timestamp || Date.now()}`,
        timestamp: log.timestamp || new Date().toISOString(),
        shouldAnimate: false, // Explicitly disable animation
      }));

    setVisibleLogs(validLogs);
  }, [realLogs]);

  return {
    processedLogs: visibleLogs,
    currentlyTypingIndex: -1, // No typing in progress
    showThinking: isLoading && sessionStatusRef.current === "processing",
    handleTypingComplete: () => {}, // No-op
    sessionStatus: sessionStatusRef.current,
    isBackgroundProcessing: false,
    registerAnimationCallback: () => {}, // No-op
    unregisterAnimationCallback: () => {}, // No-op
    forceCompleteCurrentAnimation: () => {}, // No-op
  };
};

// Reuse existing formatting utilities
export { formatAgentName, formatTimestamp } from "./useStreamingLogs";
