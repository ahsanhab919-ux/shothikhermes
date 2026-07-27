"use client";

import {
  addStreamEvent,
  finishResearch,
  setConnectionStatus,
  setError,
  setIsSimulating,
  setSimulationStatus,
  startStreaming,
} from "@/redux/slices/researchCoreSlice";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

export const useResearchSimulation = () => {
  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);

  const startSimulationResearch = useCallback(
    async (simulationId, setIsSimulationCompleted) => {
      //   

      // Start streaming state
      const newJobId = `simulation-research-${Date.now()}`;
      dispatch(startStreaming({ jobId: newJobId }));
      dispatch(setConnectionStatus("connecting"));

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}/research/simulate_research`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify({
              chatId: simulationId, // Use r_id as chat ID for simulation
            }),
            signal: abortControllerRef.current.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        dispatch(setConnectionStatus("connected"));

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const event = JSON.parse(line);

                  if (event.step === "error") {
                    throw new Error(event.error);
                  }

                  if (event.step) {
                    dispatch(addStreamEvent(event));
                  }

                  // Handle completion - adjust this based on your simulation API response structure
                  if (event.step === "completed" || !event.step) {
                    const result = event.data || event;
                    if (result.result) {
                      dispatch(
                        finishResearch({
                          id: result._id || `sim-${Date.now()}`,
                          query: result.query || "Simulation Research",
                          result: result.result,
                          sources: result.sources || [],
                          images: result.images || [],
                          timestamp:
                            result.createdAt || new Date().toISOString(),
                          _id: result._id || `sim-${Date.now()}`,
                        }),
                      );

                      setIsSimulationCompleted(true);
                      dispatch(setIsSimulating(false));
                      dispatch(setSimulationStatus("completed"));
                    }
                  }
                } catch (parseError) {
                  console.error(
                    "Failed to parse simulation stream event:",
                    parseError,
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          dispatch(setError(`Simulation failed: ${error.message}`));
          dispatch(setConnectionStatus("failed"));
        }
      }
    },
    [dispatch],
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          // Abort may fail if already aborted - safe to ignore
        }
        abortControllerRef.current = null;
      }
    };
  }, []);

  return {
    startSimulationResearch,
  };
};
