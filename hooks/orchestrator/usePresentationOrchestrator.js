/**
 * Presentation Orchestrator Hook
 *
 * This hook manages the complete lifecycle of a presentation based on its status:
 * - queued: Initiates socket connection for real-time updates
 * - processing: Builds socket connection to receive streaming data
 * - completed: Fetches historical logs from the API
 * - failed: Handles error state and updates Redux
 *
 * Flow:
 * 1. Check presentation status via API
 * 2. Route to appropriate handler based on status
 * 3. Manage socket connections or history fetching
 * 4. Update Redux state accordingly
 *
 * @module usePresentationOrchestrator
 */

import {
  resetPresentationState,
  selectPresentation,
  setCurrentSlideId,
  setHistoryData,
  setPresentationState,
  setStatus,
} from "@/redux/slices/presentationSlice";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import usePresentationSocket from "../usePresentationSocket";

/**
 * Presentation status constants
 */
const PRESENTATION_STATUS = {
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
};

/**
 * Hook status constants for internal state management
 */
const HOOK_STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  STREAMING: "streaming",
  LOADING_HISTORY: "loading_history",
  READY: "ready",
  ERROR: "error",
};

/**
 * Custom hook for orchestrating presentation lifecycle
 *
 * @param {string} presentationId - The presentation ID to manage
 * @returns {Object} Orchestrator state and utilities
 */
export default function usePresentationOrchestrator(presentationId) {
  const dispatch = useDispatch();
  const presentationState = useSelector(selectPresentation);
  const [hookStatus, setHookStatus] = useState(HOOK_STATUS.IDLE);
  const [error, setError] = useState(null);
  const statusCheckIntervalRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const currentStatusRef = useRef(null);
  const initializedPresentationIdRef = useRef(null); // Track which presentationId was initialized
  const startPresentationCalledRef = useRef(false); // Track if startPresentation was called for current status
  const isInitializingRef = useRef(false); // Track if we're in initialization flow

  // Get environment variables
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const SLIDE_PREFIX = "/slide";
  const API_URL = process.env.NEXT_PUBLIC_API_URL + SLIDE_PREFIX;

  // Determine if socket should be connected based on Redux status or internal status
  // This allows the socket to reconnect when status changes to queued/processing
  const shouldConnectSocket =
    presentationState.presentationStatus === PRESENTATION_STATUS.PROCESSING ||
    presentationState.presentationStatus === PRESENTATION_STATUS.QUEUED ||
    currentStatusRef.current === PRESENTATION_STATUS.PROCESSING ||
    currentStatusRef.current === PRESENTATION_STATUS.QUEUED;

  // Get pId from Redux state (for follow-up queries) or from presentationId prop
  // This ensures we use the correct pId even when it changes in Redux
  const currentPId =
    presentationState.slideCurrentId || presentationState.pId || presentationId;

  // Initialize socket hook (connects when status is processing or queued)
  // CRITICAL: Use currentPId from Redux state, not presentationId prop
  // This ensures follow-up queries with same p_id reconnect properly
  const { isConnected: socketConnected } = usePresentationSocket(
    shouldConnectSocket ? currentPId : null,
    token,
  );

  /**
   * Fetch presentation status from API
   *
   * @param {string} pId - Presentation ID
   * @returns {Promise<Object|null>} Status data or null on error
   */
  const fetchPresentationStatus = useCallback(
    async (pId) => {
      if (!pId || !token || !API_URL) {
        console.warn("[Orchestrator] Missing required params: pId, token, or API_URL");
        return null;
      }

      try {

        const response = await fetch(`${API_URL}/presentation-status/${pId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Status API returned ${response.status}`);
        }

        const data = await response.json();

        return data;
      } catch (error) {
        console.error("[Orchestrator] Error fetching status:", error);
        setError(error.message);
        return null;
      }
    },
    [token, API_URL],
  );

  /**
   * Fetch presentation history/logs from API
   *
   * @param {string} pId - Presentation ID
   * @returns {Promise<Object|null>} Parsed history data or null on error
   */
  const fetchPresentationHistory = useCallback(
    async (pId) => {
      if (!pId || !token || !API_URL) {
        console.warn("[Orchestrator] Missing required params: pId, token, or API_URL");
        return null;
      }

      try {

        const response = await fetch(`${API_URL}/logs?p_id=${pId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`History API returned ${response.status}`);
        }

        const rawData = await response.json();

        // Import and use the history parser
        const {
          parseHistoryData,
          validateHistoryData,
          extractPresentationSummary,
        } = await import("@/utils/presentation/presentationHistoryDataParser");

        // Extract summary for logging
        const summary = extractPresentationSummary(rawData);

        // Parse the history data
        const parsedData = parseHistoryData(rawData);

        if (!parsedData || !validateHistoryData(parsedData)) {
          throw new Error("Failed to parse history data");
        }

        return parsedData;
      } catch (error) {
        console.error("[Orchestrator] Error fetching/parsing history:", error);
        setError(error.message);
        return null;
      }
    },
    [token, API_URL],
  );

  /**
   * Start presentation process
   * Called for queued status to initiate the presentation generation
   *
   * @param {string} pId - Presentation ID
   * @param {boolean} skipDuplicateCheck - Skip duplicate check (for follow-up queries)
   */
  const startPresentation = useCallback(
    async (pId, skipDuplicateCheck = false) => {
      if (!pId || !token || !API_URL) {
        console.warn("[debug info removed]");
        return;
      }

      // Prevent duplicate calls unless explicitly skipped (for follow-up queries)
      if (!skipDuplicateCheck && startPresentationCalledRef.current) {
        return;
      }

      try {
        startPresentationCalledRef.current = true;

        const response = await fetch(`${API_URL}/start-presentation/${pId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
      } catch (error) {
        console.error("[Orchestrator] Error starting presentation:", error);
        setError(error.message);
        startPresentationCalledRef.current = false; // Reset on error to allow retry
      }
    },
    [token, API_URL],
  );

  /**
   * Handle QUEUED status
   * Initiates socket connection and starts the presentation
   *
   * @param {string} pId - Presentation ID
   */
  const handleQueuedStatus = useCallback(
    async (pId) => {

      setHookStatus(HOOK_STATUS.STREAMING);

      dispatch(
        setStatus({
          status: "streaming",
          presentationStatus: PRESENTATION_STATUS.QUEUED,
        }),
      );

      dispatch(setCurrentSlideId({ presentationId: pId }));

      // Start the presentation process (skip duplicate check since we're in initialization)
      await startPresentation(pId, false);

      // Socket will automatically connect via usePresentationSocket
    },
    [dispatch, startPresentation],
  );

  /**
   * Handle PROCESSING status
   * Builds socket connection to receive real-time updates
   *
   * @param {string} pId - Presentation ID
   */
  const handleProcessingStatus = useCallback(
    async (pId) => {

      setHookStatus(HOOK_STATUS.LOADING_HISTORY);

      dispatch(
        setStatus({
          status: "loading_history",
          presentationStatus: PRESENTATION_STATUS.PROCESSING,
        }),
      );

      dispatch(setCurrentSlideId({ presentationId: pId }));

      // STEP 1: Fetch and load historical data first
      const historyData = await fetchPresentationHistory(pId);

      if (historyData) {
        // Load history into Redux
        dispatch(setHistoryData(historyData));
      } else {
        console.warn("[Orchestrator] No history data found for presentation:", pId);
      }

      // STEP 2: Now transition to streaming mode for real-time updates
      setHookStatus(HOOK_STATUS.STREAMING);

      dispatch(
        setStatus({
          status: "streaming",
          presentationStatus: PRESENTATION_STATUS.PROCESSING,
        }),
      );

      // Socket will automatically connect via usePresentationSocket
      // because currentStatusRef.current is now PROCESSING
    },
    [dispatch, fetchPresentationHistory],
  );

  /**
   * Handle COMPLETED status
   * Fetches historical logs and updates Redux with completed state
   *
   * @param {string} pId - Presentation ID
   */
  const handleCompletedStatus = useCallback(
    async (pId) => {

      setHookStatus(HOOK_STATUS.LOADING_HISTORY);

      dispatch(
        setStatus({
          status: "completed",
          presentationStatus: PRESENTATION_STATUS.COMPLETED,
        }),
      );

      dispatch(setCurrentSlideId({ presentationId: pId }));

      // Fetch history data
      const historyData = await fetchPresentationHistory(pId);

      if (historyData) {
        dispatch(setPresentationState({ ...historyData, _replaceArrays: true }));
      }

      setHookStatus(HOOK_STATUS.READY);
    },
    [dispatch, fetchPresentationHistory],
  );

  /**
   * Handle FAILED status
   * Updates Redux with error state and stops any ongoing processes
   *
   * @param {string} pId - Presentation ID
   * @param {string} errorMessage - Optional error message
   */
  const handleFailedStatus = useCallback(
    (pId, errorMessage = "Presentation generation failed") => {
      console.error("[Orchestrator] ❌ Handling FAILED status:", errorMessage);

      setHookStatus(HOOK_STATUS.ERROR);
      setError(errorMessage);

      dispatch(
        setStatus({
          status: "failed",
          presentationStatus: PRESENTATION_STATUS.FAILED,
          error: errorMessage,
        }),
      );

      dispatch(setCurrentSlideId({ presentationId: pId }));

      // Clear any ongoing polling
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    },
    [dispatch],
  );

  /**
   * Route status to appropriate handler
   *
   * @param {Object} statusData - Status data from API
   * @param {string} statusData.p_id - Presentation ID
   * @param {string} statusData.status - Presentation status
   */
  const routeStatusHandler = useCallback(
    async (statusData) => {
      if (!statusData || !statusData.p_id || !statusData.status) {
        console.warn("[Orchestrator] Invalid status data:", statusData);
        return;
      }

      const { p_id, status } = statusData;
      currentStatusRef.current = status;


      switch (status) {
        case PRESENTATION_STATUS.QUEUED:
          await handleQueuedStatus(p_id);
          break;

        case PRESENTATION_STATUS.PROCESSING:
          await handleProcessingStatus(p_id);
          break;

        case PRESENTATION_STATUS.COMPLETED:
          await handleCompletedStatus(p_id);
          break;

        case PRESENTATION_STATUS.FAILED:
          handleFailedStatus(p_id, "Presentation generation failed");
          break;

        default:
          console.warn(`[Orchestrator] Unknown status: ${status}`);
          handleFailedStatus(p_id, `Unknown status: ${status}`);
      }
    },
    [
      handleQueuedStatus,
      handleProcessingStatus,
      handleCompletedStatus,
      handleFailedStatus,
    ],
  );

  /**
   * Initialize orchestrator
   * Fetches status and routes to appropriate handler
   */
  const initialize = useCallback(async () => {
    if (!presentationId) {
      console.warn("[Orchestrator] No presentation ID provided");
      return;
    }

    // Check if we've already initialized for this specific presentationId
    if (
      hasInitializedRef.current &&
      initializedPresentationIdRef.current === presentationId
    ) {
      return;
    }


    hasInitializedRef.current = true;
    initializedPresentationIdRef.current = presentationId;
    isInitializingRef.current = true;
    startPresentationCalledRef.current = false; // Reset for new initialization
    setHookStatus(HOOK_STATUS.CHECKING);

    // Fetch initial status
    const statusData = await fetchPresentationStatus(presentationId);

    if (statusData) {
      await routeStatusHandler(statusData);
    } else {
      handleFailedStatus(presentationId, "Failed to fetch presentation status");
    }

    // Mark initialization as complete
    isInitializingRef.current = false;
  }, [
    presentationId,
    fetchPresentationStatus,
    routeStatusHandler,
    handleFailedStatus,
  ]);

  /**
   * Main effect - Initialize on presentationId change
   * Production-grade: Reset state when presentationId changes (not just on unmount)
   * This ensures clean state transitions between different presentations
   */
  useEffect(() => {
    if (!presentationId) {
      return;
    }

    // Check if this is a different presentationId than what we initialized
    const isNewPresentationId =
      initializedPresentationIdRef.current !== presentationId;

    if (isNewPresentationId) {
      // Reset state when presentationId changes (production-grade approach)
      // This prevents stale data from previous presentations
      dispatch(resetPresentationState());
      hasInitializedRef.current = false; // Allow re-initialization for new ID
      initializedPresentationIdRef.current = null;
      startPresentationCalledRef.current = false;
    }

    // Only initialize if we haven't already initialized for this presentationId
    if (
      !hasInitializedRef.current ||
      initializedPresentationIdRef.current !== presentationId
    ) {
      initialize();
    }

    // Cleanup: Only cleanup intervals/timers, not state (state is presentationId-scoped)
    return () => {

      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }

      // Only reset if this is the presentationId we initialized
      if (initializedPresentationIdRef.current === presentationId) {
        hasInitializedRef.current = false;
        initializedPresentationIdRef.current = null;
        startPresentationCalledRef.current = false;
      }
      currentStatusRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationId, dispatch]); // Removed 'initialize' from deps to prevent re-runs

  /**
   * Retry mechanism for failed presentations
   */
  const retry = useCallback(() => {
    hasInitializedRef.current = false;
    initializedPresentationIdRef.current = null;
    startPresentationCalledRef.current = false;
    isInitializingRef.current = false;
    setError(null);
    dispatch(resetPresentationState());
    initialize();
  }, [initialize, dispatch]);

  /**
   * Handle follow-up queued status
   * Called when a follow-up query returns with queued status
   * This resumes the orchestrator process for the same presentation
   */
  const handleFollowUpQueued = useCallback(
    async (pId) => {

      // Update internal status ref
      currentStatusRef.current = PRESENTATION_STATUS.QUEUED;

      // Update hook status
      setHookStatus(HOOK_STATUS.STREAMING);

      // Update Redux status (if not already set)
      dispatch(
        setStatus({
          status: "streaming",
          presentationStatus: PRESENTATION_STATUS.QUEUED,
        }),
      );

      dispatch(setCurrentSlideId({ presentationId: pId }));

      // Start the presentation process (skip duplicate check for follow-up queries)
      await startPresentation(pId, true);

    },
    [dispatch, startPresentation],
  );

  // Watch for status changes in Redux and handle follow-up queued status
  // This ensures the orchestrator's internal state stays in sync with Redux
  useEffect(() => {
    const reduxStatus = presentationState.presentationStatus;
    const currentPId =
      presentationState.slideCurrentId ||
      presentationState.pId ||
      presentationId;

    // Skip if we're currently initializing (to prevent duplicate startPresentation calls)
    if (isInitializingRef.current) {
      return;
    }

    // Handle status changes
    if (reduxStatus && currentStatusRef.current !== reduxStatus) {

      // Update internal state to match Redux
      currentStatusRef.current = reduxStatus;

      // Handle different statuses
      if (
        reduxStatus === PRESENTATION_STATUS.QUEUED ||
        reduxStatus === PRESENTATION_STATUS.PROCESSING
      ) {
        // For queued/processing, set to streaming mode
        setHookStatus(HOOK_STATUS.STREAMING);

        // If status is queued, also call startPresentation to ensure the backend is ready
        // BUT only if it wasn't already called during initialization
        if (
          reduxStatus === PRESENTATION_STATUS.QUEUED &&
          currentPId &&
          !startPresentationCalledRef.current
        ) {
          startPresentation(currentPId);
        } else if (
          reduxStatus === PRESENTATION_STATUS.QUEUED &&
          startPresentationCalledRef.current
        ) {
        }
      } else if (reduxStatus === PRESENTATION_STATUS.COMPLETED) {
        // For completed status, set to ready mode (socket will disconnect automatically)
        setHookStatus(HOOK_STATUS.READY);
      } else if (reduxStatus === PRESENTATION_STATUS.FAILED) {
        // For failed status, set to error mode
        setHookStatus(HOOK_STATUS.ERROR);
      }
    }
  }, [
    presentationState.presentationStatus,
    presentationState.slideCurrentId,
    presentationState.pId,
    presentationId,
    startPresentation,
  ]);

  return {
    hookStatus,
    error,
    retry,
    currentStatus: currentStatusRef.current,
    socketConnected,
    handleFollowUpQueued, // Expose method for follow-up queries
  };
}
