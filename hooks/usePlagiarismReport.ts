import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import logger from "@/lib/logger";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import type { RootState } from "@/redux/store";
import {
  getCachedReport,
  setCachedReport,
} from "@/services/cache/PlagiarismCacheManager";
import {
  analyzePlagiarism,
  PlagiarismServiceError,
  QuotaExceededError,
  UnauthorizedError,
} from "@/services/plagiarismService";
import type { PlagiarismReport } from "@/types/plagiarism";
import { toast } from "react-toastify";
import {
  normalizePlagiarismInlineError,
  type PlagiarismInlineError,
} from "@/components/plagiarism/plagiarism-modernization";

type PlagiarismState = {
  loading: boolean;
  report: PlagiarismReport | null;
  error: string | null;
  inlineError: PlagiarismInlineError | null;
  fromCache: boolean;
  isNetworkError: boolean;
};

const normalizeKey = (text: string) => text.trim().toLowerCase();
const DRAFT_KEY = "shothik:plagiarism:draft-text";

function saveDraft(text: string) {
  try {
    if (typeof window !== "undefined" && text.trim()) {
      localStorage.setItem(DRAFT_KEY, text);
    }
  } catch { /* storage full */ }
}

function loadDraft(): string {
  try {
    if (typeof window !== "undefined") {
      return localStorage.getItem(DRAFT_KEY) || "";
    }
  } catch { /* ignore */ }
  return "";
}

function clearDraft() {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch { /* ignore */ }
}

export const usePlagiarismReport = (text: string) => {
  const dispatch = useDispatch();

  const accessToken = useSelector((state: RootState) => state?.auth?.accessToken);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestInProgressRef = useRef<boolean>(false);
  const retryAttemptRef = useRef<number>(0);

  const [state, setState] = useState<PlagiarismState>({
    loading: false,
    report: null,
    error: null,
    inlineError: null,
    fromCache: false,
    isNetworkError: false,
  });

  const resetState = useCallback(() => {
    setState({
      loading: false,
      report: null,
      error: null,
      inlineError: null,
      fromCache: false,
      isNetworkError: false,
    });
    clearDraft();
  }, []);

  const stopActiveRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRequestInProgressRef.current = false;
  }, []);

  const handleError = useCallback(
    (error: unknown, currentText?: string) => {
      let message = "Unable to complete plagiarism scan. Please try again.";
      const inlineError = normalizePlagiarismInlineError(error, currentText || "");

      logger.error("[plagiarism-ui] scan error", error, {
        userId:
          (typeof window !== "undefined" && window.localStorage.getItem("userId")) || null,
        inputLength: currentText?.length || 0,
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        timestamp: new Date().toISOString(),
        tier: inlineError.tier,
      });

      if (error instanceof UnauthorizedError) {
        message = error.message || "Please sign in to continue.";
        dispatch(setShowLoginModal(true));
      } else if (error instanceof QuotaExceededError) {
        message =
          error.message || "You have reached your plagiarism scan limit.";
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(message));
      } else if (error instanceof PlagiarismServiceError) {
        if (error.status === 0) {
          message = "Could not connect to the server. Please check your internet connection and try again.";
          if (currentText) saveDraft(currentText);
          setState((prev) => ({
            ...prev,
            loading: false,
            error: message,
            inlineError,
            fromCache: false,
            isNetworkError: true,
          }));
          toast.error(message);
          return;
        } else {
          message = error.message || message;
        }
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        inlineError,
        fromCache: false,
        isNetworkError: false,
      }));

      toast.error(message);
    },
    [dispatch],
  );

  const runScan = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      const currentText = text || "";
      const trimmedText = normalizeKey(currentText);
      const effectiveToken =
        accessToken ||
        (typeof window !== "undefined" ? window.localStorage.getItem("accessToken") : null) ||
        undefined;

      if (!trimmedText) {
        stopActiveRequest();
        const inlineError = normalizePlagiarismInlineError(
          new PlagiarismServiceError("Text input is required", 400),
          currentText,
        );
        setState({
          loading: false,
          report: null,
          error: inlineError.shortMessage,
          inlineError,
          fromCache: false,
          isNetworkError: false,
        });
        return;
      }

      if (isRequestInProgressRef.current && !options?.forceRefresh) {
        return;
      }

      if (!options?.forceRefresh) {
        const cachedReport = getCachedReport(trimmedText);
        if (cachedReport) {
          flushSync(() => {
            setState({
              loading: false,
              report: cachedReport,
              error: null,
              inlineError: null,
              fromCache: true,
              isNetworkError: false,
            });
          });
          isRequestInProgressRef.current = false;
          return cachedReport;
        }
      }

      if (
        abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted
      ) {
        stopActiveRequest();
      }

      isRequestInProgressRef.current = true;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        inlineError: null,
        fromCache: false,
        isNetworkError: false,
      }));

      try {
        const report = await analyzePlagiarism({
          text,
          token: effectiveToken,
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) {
          isRequestInProgressRef.current = false;
          return;
        }

        const isCurrentRequest = abortControllerRef.current === abortController;
        if (!isCurrentRequest) {
          isRequestInProgressRef.current = false;
          return;
        }

        if (!report) {
          console.error("[Plagiarism] Scan completed but report is null/undefined");
          setState({
            loading: false,
            report: null,
            error: "Scan completed but no report was returned. Please try again.",
            inlineError: normalizePlagiarismInlineError(
              new PlagiarismServiceError("Scan completed but no report was returned. Please try again.", 500),
              currentText,
            ),
            fromCache: false,
            isNetworkError: false,
          });
          isRequestInProgressRef.current = false;
          return;
        }

        setCachedReport(trimmedText, report);
        clearDraft();

        flushSync(() => {
          setState({
            loading: false,
            report,
            error: null,
            inlineError: null,
            fromCache: false,
            isNetworkError: false,
          });
        });

        if (isCurrentRequest) {
          abortControllerRef.current = null;
        }
        isRequestInProgressRef.current = false;

        return report;
      } catch (error) {
        if (abortControllerRef.current !== abortController) {
          return;
        }

        if ((error as Error)?.name === "AbortError") {
          isRequestInProgressRef.current = false;
          return;
        }

        console.error("[Plagiarism] Scan error:", (error as Error)?.message);
        retryAttemptRef.current += 1;

        isRequestInProgressRef.current = false;
        handleError(error, text);
      } finally {
        if (abortControllerRef.current === abortController && abortController.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      accessToken,
      handleError,
      resetState,
      stopActiveRequest,
      text,
    ],
  );

  useEffect(() => {
    const handleOnline = () => {
      if (state.isNetworkError) {
        toast.info("Connection restored. Retrying scan...");
        retryAttemptRef.current = 0;
        runScan({ forceRefresh: true });
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [state.isNetworkError, runScan]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    loading: state.loading,
    report: state.report,
    error: state.error,
    inlineError: state.inlineError,
    fromCache: state.fromCache,
    isNetworkError: state.isNetworkError,
    savedDraft: loadDraft(),
    triggerCheck: runScan,
    retryWithBackoff: async () => {
      const delay = Math.min(8000, 1000 * 2 ** retryAttemptRef.current);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return runScan({ forceRefresh: true });
    },
    manualRefresh: () => runScan({ forceRefresh: true }),
    reset: resetState,
    clearDraft,
  };
};

export default usePlagiarismReport;
