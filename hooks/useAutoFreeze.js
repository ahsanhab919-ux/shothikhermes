// hooks/useAutoFreeze.js
import {
  detectAutoFreezeTerms,
  disableAutoFreezeTerm,
  enableAutoFreezeTerm,
  getDisabledTerms,
} from "@/services/paraphrase.service";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

/**
 * Custom hook to manage auto-freeze functionality
 */
export const useAutoFreeze = ({
  userInput,
  language,
  frozenWords,
  onAutoFreeze,
  debounceMs = 1000,
  enableLLM = false,
  shouldAutoFreeze = false,
}) => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const [autoFrozenTerms, setAutoFrozenTerms] = useState(new Map());
  const [userDisabledTerms, setUserDisabledTerms] = useState(new Set());
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastLLMCall, setLastLLMCall] = useState(0);

  // Track detection stats
  const [stats, setStats] = useState({
    totalDetections: 0,
    cacheHits: 0,
    llmCalls: 0,
    avgLatency: 0,
  });

  const detectionTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // LLM cooldown based on user package
  const getLLMCooldown = useCallback(() => {
    const cooldowns = {
      free: 60000, // 1 minute
      value_plan: 30000, // 30 seconds
      pro_plan: 10000, // 10 seconds
      unlimited: 5000, // 5 seconds
    };
    return cooldowns[user?.package] || cooldowns.free;
  }, [user?.package]);

  /**
   * Load user's disabled terms on mount
   */
  useEffect(() => {
    const loadDisabledTerms = async () => {
      if (!accessToken) return;

      try {
        const { disabledTerms } = await getDisabledTerms(accessToken);
        setUserDisabledTerms(new Set(disabledTerms));
      } catch (error) {
        console.error("Failed to load disabled terms:", error);
      }
    };

    loadDisabledTerms();
  }, [accessToken]);

  /**
   * Main detection function
   */
  // 
  const detectTerms = useCallback(
    async (text, useLLM = false) => {
      if (!text || text.length < 10 || !shouldAutoFreeze) {
        return;
      }

      // Abort any ongoing detection
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsDetecting(true);

      try {
        const result = await detectAutoFreezeTerms({
          text,
          language,
          useLLM,
          accessToken,
        });

        // Update stats
        setStats((prev) => ({
          totalDetections: prev.totalDetections + 1,
          cacheHits: prev.cacheHits + (result.metadata.fromCache ? 1 : 0),
          llmCalls: prev.llmCalls + (result.metadata.llmUsed ? 1 : 0),
          avgLatency: Math.round(
            (prev.avgLatency * prev.totalDetections + result.metadata.latency) /
              (prev.totalDetections + 1),
          ),
        }));

        // Process detected terms
        const newAutoFrozen = new Map();
        const termsToFreeze = [];

        result.autoFreezeTerms.forEach((termObj) => {
          const term = termObj.term.toLowerCase();

          // Skip if user has disabled this term
          if (userDisabledTerms.has(term)) {
            return;
          }

          // Skip if already manually frozen
          if (frozenWords.has(term)) {
            return;
          }

          newAutoFrozen.set(term, {
            ...termObj,
            detectedAt: Date.now(),
          });

          termsToFreeze.push(term);
        });

        // Update state
        setAutoFrozenTerms(newAutoFrozen);

        // Notify parent component to freeze terms
        if (onAutoFreeze && termsToFreeze.length > 0) {
          onAutoFreeze(termsToFreeze);
        }

        // Update LLM call time
        if (result.metadata.llmUsed) {
          setLastLLMCall(Date.now());
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Auto-freeze detection failed:", error);
        }
      } finally {
        setIsDetecting(false);
      }
    },
    [
      language,
      accessToken,
      frozenWords,
      userDisabledTerms,
      onAutoFreeze,
      shouldAutoFreeze,
    ],
  );

  /**
   * Debounced detection effect
   */
  useEffect(() => {
    // Clear existing timer
    if (detectionTimerRef.current) {
      clearTimeout(detectionTimerRef.current);
    }

    // Don't detect if input is too short
    if (!userInput || userInput.length < 10) {
      return;
    }

    // Schedule detection
    detectionTimerRef.current = setTimeout(() => {
      // Determine if we should use LLM
      const shouldUseLLM = enableLLM && userInput.length > 200;

      detectTerms(userInput, shouldUseLLM);
    }, debounceMs);

    return () => {
      if (detectionTimerRef.current) {
        clearTimeout(detectionTimerRef.current);
      }
    };
  }, [
    userInput,
    shouldAutoFreeze,
    // debounceMs,
    // enableLLM,
    // detectTerms,
    // lastLLMCall,
    // getLLMCooldown,
  ]);

  /**
   * Disable auto-freeze for a term
   */
  const disableTerm = useCallback(
    async (term) => {
      try {
        await disableAutoFreezeTerm(term, accessToken);

        // Update local state
        setUserDisabledTerms((prev) => new Set([...prev, term.toLowerCase()]));
        setAutoFrozenTerms((prev) => {
          const updated = new Map(prev);
          updated.delete(term.toLowerCase());
          return updated;
        });

        return { success: true };
      } catch (error) {
        console.error("Failed to disable term:", error);
        return { success: false, error: error.message };
      }
    },
    [accessToken],
  );

  /**
   * Re-enable auto-freeze for a term
   */
  const enableTerm = useCallback(
    async (term) => {
      try {
        await enableAutoFreezeTerm(term, accessToken);

        // Update local state
        setUserDisabledTerms((prev) => {
          const updated = new Set(prev);
          updated.delete(term.toLowerCase());
          return updated;
        });

        // Re-detect to potentially freeze it again
        detectTerms(userInput, false);

        return { success: true };
      } catch (error) {
        console.error("Failed to enable term:", error);
        return { success: false, error: error.message };
      }
    },
    [accessToken, userInput, detectTerms],
  );

  /**
   * Check if a term is auto-frozen
   */
  const isAutoFrozen = useCallback(
    (term) => {
      return autoFrozenTerms.has(term.toLowerCase());
    },
    [autoFrozenTerms],
  );

  /**
   * Get term info
   */
  const getTermInfo = useCallback(
    (term) => {
      return autoFrozenTerms.get(term.toLowerCase());
    },
    [autoFrozenTerms],
  );

  return {
    autoFrozenTerms,
    userDisabledTerms,
    isDetecting,
    stats,
    disableTerm,
    enableTerm,
    isAutoFrozen,
    getTermInfo,
  };
};
