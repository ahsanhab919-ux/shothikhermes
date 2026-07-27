"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { GeneratePdfRequest, BuildStatus } from "@/types/writing-studio";
import { generatePdf, getBuildStatus, handleWritingStudioError } from "@/services/writing-studio.service";

interface BuildState {
  status: BuildStatus | null;
  buildId: string | null;
  pdfUrl: string | null;
  error: string | null;
  isBuilding: boolean;
}

const initialBuildState: BuildState = {
  status: null,
  buildId: null,
  pdfUrl: null,
  error: null,
  isBuilding: false,
};

const POLL_INTERVAL = 2000;
const MAX_POLLS = 60;

export function useDocumentBuild() {
  const [buildState, setBuildState] = useState<BuildState>(initialBuildState);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const startPolling = useCallback((buildId: string) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      if (!mountedRef.current) {
        stopPolling();
        return;
      }

      pollCountRef.current += 1;

      if (pollCountRef.current >= MAX_POLLS) {
        stopPolling();
        setBuildState((prev) => ({
          ...prev,
          status: "failed",
          error: "Build timed out. Please try again.",
          isBuilding: false,
        }));
        return;
      }

      try {
        const response = await getBuildStatus(buildId);

        if (!mountedRef.current) return;

        if (response.status === "completed") {
          stopPolling();
          setBuildState((prev) => ({
            ...prev,
            status: "completed",
            pdfUrl: response.pdfUrl || null,
            error: null,
            isBuilding: false,
          }));
        } else if (response.status === "failed") {
          stopPolling();
          setBuildState((prev) => ({
            ...prev,
            status: "failed",
            error: response.error || "Build failed. Please try again.",
            isBuilding: false,
          }));
        } else {
          setBuildState((prev) => ({
            ...prev,
            status: response.status,
          }));
        }
      } catch (error) {
        if (!mountedRef.current) return;
        stopPolling();
        setBuildState((prev) => ({
          ...prev,
          status: "failed",
          error: handleWritingStudioError(error),
          isBuilding: false,
        }));
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  const startBuild = useCallback(async (html: string, options?: Partial<GeneratePdfRequest>) => {
    setBuildState({
      status: "queued",
      buildId: null,
      pdfUrl: null,
      error: null,
      isBuilding: true,
    });

    try {
      const response = await generatePdf({
        html,
        ...options,
      });

      if (!mountedRef.current) return;

      setBuildState((prev) => ({
        ...prev,
        buildId: response.buildId,
        status: response.status,
      }));

      startPolling(response.buildId);
    } catch (error) {
      if (!mountedRef.current) return;
      setBuildState({
        status: "failed",
        buildId: null,
        pdfUrl: null,
        error: handleWritingStudioError(error),
        isBuilding: false,
      });
    }
  }, [startPolling]);

  const resetBuild = useCallback(() => {
    stopPolling();
    setBuildState(initialBuildState);
  }, [stopPolling]);

  const downloadPdf = useCallback(() => {
    if (buildState.pdfUrl) {
      window.open(buildState.pdfUrl, '_blank');
    }
  }, [buildState.pdfUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  return {
    buildState,
    startBuild,
    resetBuild,
    downloadPdf,
  };
}

export default useDocumentBuild;
