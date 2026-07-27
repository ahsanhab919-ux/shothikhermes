// hooks/useStreamingLogs.ts
import { useState, useEffect, useRef, useCallback } from "react";
import type { AgentLog, LogHookResult, SessionStatus } from "@/types/logs";

// Storage key for tracking animated logs
const ANIMATED_LOGS_KEY = "streamingLogs_animated";

// Get animated logs from storage
const getAnimatedLogs = (): Set<string> => {
  try {
    const stored = JSON.parse(
      sessionStorage.getItem(ANIMATED_LOGS_KEY) || "[]",
    );
    return new Set(stored);
  } catch {
    return new Set();
  }
};

// Save animated logs to storage
const saveAnimatedLogs = (animatedSet: Set<string>) => {
  try {
    sessionStorage.setItem(ANIMATED_LOGS_KEY, JSON.stringify([...animatedSet]));
  } catch {
    // Ignore storage errors
  }
};

// Generate unique ID for a log - now handles objects safely
const generateLogId = (log: AgentLog, index: number): string => {
  const contentSlice =
    typeof log.parsed_output === "string"
      ? log.parsed_output.slice(0, 50)
      : JSON.stringify(log.parsed_output).slice(0, 50);
  return `${log.agent_name}_${log.timestamp}_${index}_${contentSlice}`;
};

export const useStreamingLogs = (
  realLogs: AgentLog[],
  isLoading: boolean,
  status: string,
  presentationId: string,
): LogHookResult => {
  const [processedLogs, setProcessedLogs] = useState<AgentLog[]>([]);
  const [visibleLogs, setVisibleLogs] = useState<AgentLog[]>([]);
  const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState(-1);
  const [showThinking, setShowThinking] = useState(false);

  const allLogsRef = useRef<AgentLog[]>([]);
  const nextLogIndexRef = useRef(0);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animatedLogsRef = useRef<Set<string>>(getAnimatedLogs());
  const sessionStatusRef = useRef<SessionStatus>("processing");
  const backgroundProcessingRef = useRef(false);

  const currentAnimationRef = useRef<{
    logIndex: number;
    forceComplete: (() => void) | null;
  }>({ logIndex: -1, forceComplete: null });

  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const forceCompleteCurrentAnimation = useCallback(() => {
    if (
      currentAnimationRef.current.logIndex >= 0 &&
      currentAnimationRef.current.forceComplete
    ) {
      console.log(
        "Forcing completion of animation for log:",
        currentAnimationRef.current.logIndex,
      );
      currentAnimationRef.current.forceComplete();
      currentAnimationRef.current = { logIndex: -1, forceComplete: null };
    }
  }, []);

  const shouldAnimateLog = useCallback((log: AgentLog, index: number): boolean => {
    const logId = generateLogId(log, index);
    const hasBeenAnimated = animatedLogsRef.current.has(logId);

    // Do not animate if it's not a string
    if (typeof log.parsed_output !== "string") {
      return false;
    }

    if (
      (sessionStatusRef.current === "completed" ||
        sessionStatusRef.current === "failed") &&
      !backgroundProcessingRef.current
    ) {
      return false;
    }

    return !hasBeenAnimated;
  }, []);

  const markLogAsAnimated = useCallback((log: AgentLog, index: number) => {
    const logId = generateLogId(log, index);
    animatedLogsRef.current.add(logId);
    saveAnimatedLogs(animatedLogsRef.current);
  }, []);

  const registerAnimationCallback = useCallback(
    (logIndex: number, forceComplete: () => void) => {
      currentAnimationRef.current = { logIndex, forceComplete };
    },
    [],
  );

  const unregisterAnimationCallback = useCallback((logIndex: number) => {
    if (currentAnimationRef.current.logIndex === logIndex) {
      currentAnimationRef.current = { logIndex: -1, forceComplete: null };
    }
  }, []);

  const startNextLog = useCallback(() => {
    const nextIndex = nextLogIndexRef.current;
    if (nextIndex < allLogsRef.current.length) {
      const nextLog = allLogsRef.current[nextIndex];

      const isValidStringLog =
        typeof nextLog.parsed_output === "string" &&
        nextLog.parsed_output.trim();
      const isObjectLog =
        typeof nextLog.parsed_output === "object" &&
        nextLog.parsed_output !== null;

      if (nextLog && (isValidStringLog || isObjectLog)) {
        const shouldAnimate = shouldAnimateLog(nextLog, nextIndex);

        setVisibleLogs((prev) => [...prev, { ...nextLog, shouldAnimate }]);

        if (shouldAnimate) {
          setCurrentlyTypingIndex(nextIndex);
          isTypingRef.current = true;
          backgroundProcessingRef.current = true;
          setShowThinking(false);
        } else {
          setCurrentlyTypingIndex(-1);
          isTypingRef.current = false;
        }

        nextLogIndexRef.current = nextIndex + 1;

        if (!shouldAnimate) {
          const nextLogTimer = setInterval(() => {
            clearInterval(nextLogTimer);
            startNextLog();
          }, 30);
        }
      } else {
        nextLogIndexRef.current = nextIndex + 1;
        const nextLogTimer = setInterval(() => {
          clearInterval(nextLogTimer);
          startNextLog();
        }, 30);
      }
    } else {
      setCurrentlyTypingIndex(-1);
      isTypingRef.current = false;
      backgroundProcessingRef.current = false;

      const shouldShowThinking =
        isLoading && sessionStatusRef.current === "processing";
      setShowThinking(shouldShowThinking);
    }
  }, [shouldAnimateLog, isLoading]);

  const handleTypingComplete = useCallback(
    (logIndex: number) => {
      if (logIndex >= 0 && logIndex < allLogsRef.current.length) {
        markLogAsAnimated(allLogsRef.current[logIndex], logIndex);
      }

      unregisterAnimationCallback(logIndex);

      setCurrentlyTypingIndex(-1);
      isTypingRef.current = false;

      clearTypingTimeout();
      const nextLogTimer = setInterval(() => {
        clearInterval(nextLogTimer);
        startNextLog();
      }, 50);

      typingTimeoutRef.current = nextLogTimer;
    },
    [
      startNextLog,
      clearTypingTimeout,
      markLogAsAnimated,
      unregisterAnimationCallback,
    ],
  );

  const determineSessionStatus = useCallback(
    (logs: AgentLog[]): SessionStatus => {
      if (!logs || logs.length === 0) return "processing";

      const statusLog = logs.find((log) => log.status);
      if (statusLog && statusLog.status) {
        return statusLog.status;
      }

      if (!isLoading && logs.length > 0) {
        return "completed";
      }

      return "processing";
    },
    [isLoading],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        backgroundProcessingRef.current = true;
      } else {
        forceCompleteCurrentAnimation();

        const hasUnprocessedLogs =
          nextLogIndexRef.current < allLogsRef.current.length;
        const isCurrentlyTyping = currentlyTypingIndex >= 0;

        if (hasUnprocessedLogs && !isCurrentlyTyping && !isTypingRef.current) {
          const catchUpTimer = setInterval(() => {
            clearInterval(catchUpTimer);
            startNextLog();
          }, 50);
        }

        const resetTimer = setInterval(() => {
          clearInterval(resetTimer);
          backgroundProcessingRef.current = false;
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentlyTypingIndex, startNextLog, forceCompleteCurrentAnimation]);

  useEffect(() => {
    if (!realLogs || realLogs.length === 0) {
      setProcessedLogs([]);
      setVisibleLogs([]);
      setCurrentlyTypingIndex(-1);
      setShowThinking(isLoading);
      allLogsRef.current = [];
      nextLogIndexRef.current = 0;
      isTypingRef.current = false;
      backgroundProcessingRef.current = false;
      sessionStatusRef.current = "processing";
      currentAnimationRef.current = { logIndex: -1, forceComplete: null };
      clearTypingTimeout();
      return;
    }

    const newStatus = determineSessionStatus(realLogs);
    const statusChanged = sessionStatusRef.current !== newStatus;
    sessionStatusRef.current = newStatus;

    // MODIFIED: Filter logic to accept objects and non-empty strings
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
      .filter(
        (log) =>
          log.agent_name !== "browser_agent" &&
          log.agent_name !== "vibe_estimator_agent",
      )
      .map((log, index) => ({
        ...log,
        id: `log-${index}-${log.timestamp || Date.now()}`,
        timestamp: log.timestamp || new Date().toISOString(),
      }));

    const hasNewLogs = validLogs.length > allLogsRef.current.length;
    const hasStatusChange =
      statusChanged && (newStatus === "completed" || newStatus === "failed");

    if (hasNewLogs || hasStatusChange) {
      if (hasNewLogs && isTypingRef.current) {
        console.log(
          "New logs detected, forcing completion of current animation",
        );
        forceCompleteCurrentAnimation();
      }

      allLogsRef.current = validLogs;
      setProcessedLogs(validLogs);

      if (hasNewLogs) {
        backgroundProcessingRef.current = true;

        if (
          !isTypingRef.current &&
          nextLogIndexRef.current < validLogs.length
        ) {
          const startTimer = setInterval(() => {
            clearInterval(startTimer);
            startNextLog();
          }, 50);
        }
      }

      if (
        hasStatusChange &&
        (newStatus === "completed" || newStatus === "failed")
      ) {
        const completeTimer = setInterval(() => {
          clearInterval(completeTimer);

          forceCompleteCurrentAnimation();

          while (nextLogIndexRef.current < validLogs.length) {
            const logIndex = nextLogIndexRef.current;
            const log = validLogs[logIndex];

            const isValidStringLog =
              typeof log.parsed_output === "string" && log.parsed_output.trim();
            const isObjectLog =
              typeof log.parsed_output === "object" &&
              log.parsed_output !== null;

            if (log && (isValidStringLog || isObjectLog)) {
              setVisibleLogs((prev) => [
                ...prev,
                { ...log, shouldAnimate: false },
              ]);
              markLogAsAnimated(log, logIndex);
            }

            nextLogIndexRef.current++;
          }

          setCurrentlyTypingIndex(-1);
          isTypingRef.current = false;
          backgroundProcessingRef.current = false;
          currentAnimationRef.current = { logIndex: -1, forceComplete: null };

          setShowThinking(false);
        }, 300);
      }
    }
  }, [
    realLogs,
    startNextLog,
    clearTypingTimeout,
    determineSessionStatus,
    isLoading,
    markLogAsAnimated,
    forceCompleteCurrentAnimation,
  ]);

  useEffect(() => {
    const hasUnprocessedLogs =
      nextLogIndexRef.current < allLogsRef.current.length;
    const isCurrentlyTyping = currentlyTypingIndex >= 0;
    const isSessionComplete =
      sessionStatusRef.current === "completed" ||
      sessionStatusRef.current === "failed";
    const isBackgroundProcessing = backgroundProcessingRef.current;

    if (isCurrentlyTyping) {
      setShowThinking(false);
    } else if (
      isSessionComplete &&
      !hasUnprocessedLogs &&
      !isBackgroundProcessing
    ) {
      setShowThinking(false);
    } else if (isLoading && visibleLogs.length === 0) {
      setShowThinking(true);
    } else if (hasUnprocessedLogs && !isCurrentlyTyping) {
      setShowThinking(true);
    } else if (isLoading && sessionStatusRef.current === "processing") {
      setShowThinking(true);
    } else {
      setShowThinking(false);
    }
  }, [
    isLoading,
    visibleLogs.length,
    currentlyTypingIndex,
    nextLogIndexRef.current,
    allLogsRef.current.length,
  ]);

  useEffect(() => {
    // if (!realLogs || realLogs.length === 0) {
    //   animatedLogsRef.current.clear();
    //   saveAnimatedLogs(animatedLogsRef.current);
    // }

    if (status === "completed" || status === "failed") {
      animatedLogsRef.current.clear();
      saveAnimatedLogs(animatedLogsRef.current);
    }
  }, [status]);

  useEffect(() => {
    return () => {
      clearTypingTimeout();
      backgroundProcessingRef.current = false;
      currentAnimationRef.current = { logIndex: -1, forceComplete: null };
    };
  }, [clearTypingTimeout]);

  useEffect(() => {
    let monitorInterval: NodeJS.Timeout;

    if (backgroundProcessingRef.current || document.hidden) {
      monitorInterval = setInterval(() => {
        const hasUnprocessedLogs =
          nextLogIndexRef.current < allLogsRef.current.length;
        const isCurrentlyTyping = isTypingRef.current;

        if (hasUnprocessedLogs && !isCurrentlyTyping) {
          startNextLog();
        }

        if (!hasUnprocessedLogs && !isCurrentlyTyping) {
          backgroundProcessingRef.current = false;
          clearInterval(monitorInterval);

          if (
            sessionStatusRef.current === "completed" ||
            sessionStatusRef.current === "failed"
          ) {
            setShowThinking(false);
          }
        }
      }, 100);
    }

    return () => {
      if (monitorInterval) {
        clearInterval(monitorInterval);
      }
    };
  }, [startNextLog]);

  return {
    processedLogs: visibleLogs,
    currentlyTypingIndex,
    showThinking,
    handleTypingComplete,
    sessionStatus: sessionStatusRef.current,
    isBackgroundProcessing: backgroundProcessingRef.current,
    registerAnimationCallback,
    unregisterAnimationCallback,
    forceCompleteCurrentAnimation,
  };
};

// Agent name formatting utility (unchanged)
export const formatAgentName = (agentName: string): string => {
  if (!agentName || typeof agentName !== "string") {
    return "AI Assistant";
  }

  const agentNames = {
    presentation_spec_extractor_agent: "Spec Extractor",
    vibe_estimator_agent: "Vibe Estimator",
    planning_agent: "Planning Agent",
    keyword_research_agent: "Keyword Research",
    content_synthesizer_agent: "Content Synthesizer",
    slide_generator_agent: "Slide Generator",
    search_query: "Search Query",
    browser_agent: "Browser Agent",
    validation_agent: "Validation Agent",
    quality_checker_agent: "Quality Checker",
    unknown_agent: "AI Assistant",
  };

  const formatted =
    agentNames[agentName] ||
    agentName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(" Agent", "");

  return formatted;
};

// Timestamp formatting utility (unchanged)
export const formatTimestamp = (timestamp: string): string => {
  try {
    if (!timestamp) {
      return "now";
    }

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (isNaN(date.getTime())) {
      return "now";
    }

    if (diff < 60000) {
      return "just now";
    }

    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Remove explicit timezone - let the browser handle it automatically
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.warn("Error formatting timestamp:", error);
    return "now";
  }
};
