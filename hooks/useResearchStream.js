"use client";

import { addMessage } from "@/redux/slices/researchChatSlice";
import {
  addStreamEvent,
  finishResearch,
  setConnectionStatus,
  setError,
  setPollingMode,
  setStreamingMode,
  startStreaming,
} from "@/redux/slices/researchCoreSlice";
import store from "@/redux/store";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { QueueStatusService } from "../services/queueStatusService";
import { useConnectionState } from "./useConnectionState";

export const useResearchStream = () => {
  const dispatch = useDispatch();
  const { currentChatId } = useSelector((state) => state.researchChat);
  const { isStreaming, jobId, isPolling, researches } = useSelector(
    (state) => state.researchCore,
  );

  const abortControllerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isPollingActiveRef = useRef(false);
  const lastStatusRef = useRef(null);
  const handlingCompletionRef = useRef(false);

  const {
    storeConnectionMetadata,
    clearConnectionMetadata,
    isConnectionInterrupted,
  } = useConnectionState();

  const hasNewEvents = useCallback((newStatus, lastStatus) => {
    if (!lastStatus || !newStatus) return true;

    const newEvents = newStatus.progress?.events || [];
    const lastEvents = lastStatus.progress?.events || [];

    // Check if we have new events
    if (newEvents.length > lastEvents.length) return true;

    // Check if status changed (completed/failed)
    if (newStatus.status !== lastStatus.status) return true;

    return false;
  }, []);

  const processNewEvents = useCallback((newStatus, lastStatus) => {
    const newEvents = newStatus.progress?.events || [];
    const lastEventCount = lastStatus?.progress?.events?.length || 0;

    // Get only the new events since last poll
    const eventsToProcess = newEvents.slice(lastEventCount);

    return eventsToProcess;
  }, []);

  // Recovery and polling logic

  const handleCompletedJob = useCallback(
    async (jobStatus) => {
      // Prevent multiple completion handlers
      if (handlingCompletionRef.current) {
        return;
      }

      handlingCompletionRef.current = true;

      try {
        // Clear polling state
        dispatch(setPollingMode(false));
        dispatch(setStreamingMode(false));

        // Check for duplicates
        const currentState = store.getState();
        const existingResearches = currentState.researchCore.researches;
        const existingResearch = existingResearches?.find(
          (research) => research._id === jobStatus.result?._id,
        );

        if (existingResearch) {
          clearConnectionMetadata();
          dispatch(setConnectionStatus("connected"));
          return;
        }

        const result = jobStatus.result;
        if (result) {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: result.result,
            sources: result.sources || [],
            images: result.images || [],
            timestamp: new Date().toISOString(),
          };

          dispatch(addMessage(aiMessage));
          dispatch(
            finishResearch({
              id: result._id,
              query: result.query,
              result: result.result,
              sources: result.sources || [],
              images: result.images || [],
              timestamp: result.createdAt,
              _id: result._id,
            }),
          );
        }

        clearConnectionMetadata();
        dispatch(setConnectionStatus("connected"));
      } catch (error) {
        console.error("Error in handleCompletedJob:", error);
        dispatch(setConnectionStatus("failed"));
      } finally {
        handlingCompletionRef.current = false;
      }
    },
    [dispatch, clearConnectionMetadata],
  );

  const startPollingMode = useCallback(
    async (targetJobId) => {
      // Prevent multiple polling sessions
      if (isPollingActiveRef.current) {
        return;
      }

      // Clear any existing polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      // Reset state
      isPollingActiveRef.current = true;
      lastStatusRef.current = null;
      handlingCompletionRef.current = false;
      reconnectAttemptsRef.current = 0;

      // Set initial state
      dispatch(startStreaming({ jobId: targetJobId }));
      dispatch(setPollingMode(true));
      dispatch(setConnectionStatus("polling"));

      let pollCount = 0;
      const maxPolls = 600; // 30 minutes at 3 second intervals

      const pollFunction = async () => {
        if (pollFunction.isRunning) {
          return;
        }

        pollFunction.isRunning = true;

        try {
          // Check if we should continue polling
          if (!isPollingActiveRef.current) {
            return;
          }

          if (handlingCompletionRef.current) {
            return;
          }

          try {
            const jobStatus =
              await QueueStatusService.getJobStatus(targetJobId);


            // Reset reconnect attempts on successful response
            reconnectAttemptsRef.current = 0;

            if (!jobStatus) {
              console.warn("No job status received");
              return;
            }

            if (!hasNewEvents(jobStatus, lastStatusRef.current)) {
              return; // Skip if no new events
            }

            // Process new events
            const newEvents = processNewEvents(
              jobStatus,
              lastStatusRef.current,
            );
            lastStatusRef.current = { ...jobStatus };

            // Dispatch new events sequentially with small delays to avoid overwhelming UI
            newEvents.forEach((event, index) => {
              setTimeout(() => {
                if (isPollingActiveRef.current) {
                  dispatch(addStreamEvent(event));
                }
              }, index * 1500); // 1.5s delay between each event
            });

            if (QueueStatusService.isJobCompleted(jobStatus)) {
              isPollingActiveRef.current = false;

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              await handleCompletedJob(jobStatus);
              return;
            }

            if (QueueStatusService.isJobFailed(jobStatus)) {
              isPollingActiveRef.current = false;

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              dispatch(setError("Research job failed"));
              dispatch(setPollingMode(false));
              dispatch(setConnectionStatus("failed"));
              clearConnectionMetadata();
              return;
            }

            pollCount++;

            // Adjust polling frequency over time
            if (pollCount === 20) {
              if (pollingIntervalRef.current && isPollingActiveRef.current) {
                clearInterval(pollingIntervalRef.current);
                // Add a small delay before creating new interval to prevent overlap
                setTimeout(() => {
                  if (isPollingActiveRef.current) {
                    pollingIntervalRef.current = setInterval(
                      pollFunction,
                      8000,
                    );
                  }
                }, 100);
              }
            } else if (pollCount === 100) {
              if (pollingIntervalRef.current && isPollingActiveRef.current) {
                clearInterval(pollingIntervalRef.current);
                setTimeout(() => {
                  if (isPollingActiveRef.current) {
                    pollingIntervalRef.current = setInterval(
                      pollFunction,
                      15000,
                    );
                  }
                }, 100);
              }
            }

            // Timeout after maximum polls
            if (pollCount >= maxPolls) {
              isPollingActiveRef.current = false;

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              dispatch(setError("Research timeout - please try again"));
              dispatch(setPollingMode(false));
              dispatch(setConnectionStatus("timeout"));
              clearConnectionMetadata();
            }
          } catch (error) {
            console.error("Polling error:", error);
            reconnectAttemptsRef.current++;

            if (reconnectAttemptsRef.current >= 5) {
              isPollingActiveRef.current = false;

              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
              }

              dispatch(setError("Failed to connect to research service"));
              dispatch(setPollingMode(false));
              dispatch(setConnectionStatus("failed"));
              clearConnectionMetadata();
            }
          }
        } finally {
          pollFunction.isRunning = false;
        }
      };

      // Start polling immediately
      // await pollFunction();

      // Continue polling if still active
      if (isPollingActiveRef.current && !handlingCompletionRef.current) {
        pollingIntervalRef.current = setInterval(pollFunction, 5000);
      }
    },
    [
      dispatch,
      handleCompletedJob,
      clearConnectionMetadata,
      hasNewEvents,
      processNewEvents,
    ],
  );

  const cancelResearch = useCallback(() => {

    // Stop polling
    isPollingActiveRef.current = false;
    handlingCompletionRef.current = false;
    lastStatusRef.current = null;
    reconnectAttemptsRef.current = 0;

    // Clear intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Abort streaming
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.warn("Error aborting controller:", e);
      }
      abortControllerRef.current = null;
    }

    // Update state
    dispatch(setPollingMode(false));
    dispatch(setStreamingMode(false));
    dispatch(setConnectionStatus("disconnected"));
    clearConnectionMetadata();
  }, [clearConnectionMetadata, dispatch]);

  const checkAndRecoverConnection = useCallback(async () => {
    const storedJobId = sessionStorage.getItem("currentResearchJobId");
    if (!storedJobId) return false;

    try {
      const jobStatus = await QueueStatusService.getJobStatus(storedJobId);

      if (QueueStatusService.isJobCompleted(jobStatus)) {
        await handleCompletedJob(jobStatus);
        return true;
      }

      if (QueueStatusService.isJobActive(jobStatus)) {
        await startPollingMode(storedJobId);
        return true;
      }

      if (QueueStatusService.isJobFailed(jobStatus)) {
        dispatch(setError("Research job failed"));
        clearConnectionMetadata();
        return false;
      }
    } catch (error) {
      console.error("Failed to recover connection:", error);
    }

    return false;
  }, [dispatch, clearConnectionMetadata, startPollingMode, handleCompletedJob]);

  const startResearch = useCallback(
    async (query, config = {}) => {
      if (!currentChatId) {
        dispatch(setError("No chat selected"));
        return;
      }

      // 

      // Check if there's already an active research
      const hasActive = await QueueStatusService.hasActiveResearch();
      if (hasActive) {
        await checkAndRecoverConnection();
        return;
      }

      // Add human message
      const humanMessage = {
        id: Date.now().toString(),
        type: "human",
        content: query,
        timestamp: new Date().toISOString(),
      };
      dispatch(addMessage(humanMessage));

      // Start streaming
      const newJobId = `research-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      dispatch(startStreaming({ jobId: newJobId }));
      dispatch(setConnectionStatus("connecting"));

      // Store connection metadata immediately
      storeConnectionMetadata(newJobId);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}/research/create_research_queue`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: JSON.stringify({
              chat: currentChatId,
              query,
              config: {
                query_generator_model: config.model || "gemini-2.0-flash",
                reflection_model: config.model || "gemini-2.0-flash",
                answer_model: config.model || "gemini-2.0-flash",
                number_of_initial_queries:
                  config.effort === "low"
                    ? 1
                    : config.effort === "medium"
                      ? 2
                      : 3,
                max_research_loops:
                  config.effort === "low"
                    ? 1
                    : config.effort === "medium"
                      ? 2
                      : 3,
              },
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
        let finalAnswer = "";
        let finalSources = [];
        let finalImages = [];
        let actualJobId = newJobId;

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

                    // Update stored metadata with latest step
                    if (event.data?.jobId) {
                      actualJobId = event.data.jobId;
                      storeConnectionMetadata(actualJobId, event.step);
                    }
                  }

                  if (event.step === "completed") {
                    finalAnswer = event.data.result || event.answer;
                    finalSources = event.data.sources || [];
                    finalImages = event.data.images || [];
                  }
                } catch (parseError) {
                  console.error("Failed to parse stream event:", parseError);
                }
              }
            }
          }
        }

        // Add AI message and finish research
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: finalAnswer,
          sources: finalSources,
          images: finalImages,
          timestamp: new Date().toISOString(),
        };

        dispatch(addMessage(aiMessage));
        dispatch(
          finishResearch({
            id: actualJobId,
            query,
            result: finalAnswer,
            sources: finalSources,
            images: finalImages,
            timestamp: new Date().toISOString(),
            _id: `temp-${Date.now()}`,
          }),
        );

        // Clear metadata on successful completion
        clearConnectionMetadata();
      } catch (error) {
        if (error.name !== "AbortError") {
          dispatch(setError(error.message));
          dispatch(setConnectionStatus("failed"));

          // Don't clear metadata on error - might need for recovery
        }
      }
    },
    [
      currentChatId,
      dispatch,
      storeConnectionMetadata,
      clearConnectionMetadata,
      checkAndRecoverConnection,
    ],
  );

  const manualReconnect = useCallback(async () => {
    reconnectAttemptsRef.current = 0;
    dispatch(setConnectionStatus("reconnecting"));
    const recovered = await checkAndRecoverConnection();
    if (!recovered) {
      dispatch(setConnectionStatus("failed"));
    }
  }, [checkAndRecoverConnection, dispatch]);

  // Cleanup effect
  useEffect(() => {
    return () => {

      isPollingActiveRef.current = false;
      handlingCompletionRef.current = false;

      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          // Abort may fail if already aborted - safe to ignore
        }
        abortControllerRef.current = null;
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      clearConnectionMetadata();
    };
  }, [clearConnectionMetadata]);

  // Check for interrupted connections on hook initialization
  useEffect(() => {
    const checkInterrupted = async () => {
      if (isConnectionInterrupted()) {
        await checkAndRecoverConnection();
      }
    };

    checkInterrupted();
  }, [isConnectionInterrupted, checkAndRecoverConnection]);

  return {
    startResearch,
    cancelResearch,
    manualReconnect,
    checkAndRecoverConnection,
    isStreaming,
    isPolling,
    jobId,
  };
};
