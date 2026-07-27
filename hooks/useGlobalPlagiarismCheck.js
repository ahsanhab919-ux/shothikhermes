import { useCallback, useMemo } from "react";

import { adaptToLegacy } from "@/adapters/LegacyPlagiarismAdapter";
import usePlagiarismReport from "./usePlagiarismReport";

const useGlobalPlagiarismCheck = (text) => {
  const {
    loading,
    report,
    error,
    inlineError,
    fromCache,
    triggerCheck,
    retryWithBackoff,
    manualRefresh,
    reset,
  } = usePlagiarismReport(text ?? "");

  // Adapt to legacy format for backward compatibility
  const legacyData = useMemo(() => {
    return adaptToLegacy(report);
  }, [report]);

  const runCheck = useCallback(
    (forceRefresh = false) => {
      // If forceRefresh is true, pass it through
      // Otherwise, call triggerCheck without options (it will check cache)
      if (forceRefresh) {
        return triggerCheck({ forceRefresh: true });
      }
      // Default behavior: check cache first, then run fresh scan if no cache
      return triggerCheck();
    },
    [triggerCheck],
  );

  return {
    loading,
    // Legacy format (for backward compatibility)
    score: legacyData.score,
    results: legacyData.results,
    // New fields (for new components)
    exactMatches: report?.exactMatches ?? [],
    allSources: report?.sources ?? [],
    citations: report?.citations ?? [],
    language: report?.language,
    exactPlagiarismPercentage: report?.exactPlagiarismPercentage ?? null,
    totalChunks: report?.summary?.totalChunks ?? null,
    // Full report (for components that need it)
    report,
    error,
    inlineError,
    fromCache,
    reset,
    triggerCheck: runCheck,
    retryWithBackoff,
    manualRefresh: () => manualRefresh(),
  };
};

export default useGlobalPlagiarismCheck;
