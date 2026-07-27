import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Session data
  sessionId: null,
  pId: null,
  userId: null,
  workerId: null,

  // Logs and slides
  logs: [], // Array of structured log objects from agents
  slides: [], // Array of slide objects with thinking + html_content

  // O(1) duplicate tracking maps (keyed by id and author+timestamp)
  logIdMap: {}, // Record<string, true> for O(1) id lookup
  logAuthorTimestampMap: {}, // Record<string, true> for O(1) author+timestamp lookup

  // Status tracking
  status: "idle", // idle, checking, streaming, completed, failed, error
  presentationStatus: null, // queued, processing, completed, failed

  // Metadata
  title: "Generating...",
  totalSlides: 0,
  slideCurrentId: null,
  error: null,
  progress: null,

  // Derived state for UI convenience
  currentPhase: "planning",
  completedPhases: [],
};

const presentationSlice = createSlice({
  name: "presentation",
  initialState,
  reducers: {
    /**
     * Add history data (logs + slides) when loading past presentations
     */
    setHistoryData(state, action) {
      const { logs, slides, status, title, totalSlides } = action.payload;

      if (Array.isArray(logs)) {
        state.logs = logs;
      }

      if (Array.isArray(slides)) {
        state.slides = slides;
      }

      if (status) {
        state.status = status;
        state.presentationStatus = status;
      }

      if (title) {
        state.title = title;
      }

      if (totalSlides) {
        state.totalSlides = totalSlides;
      }
    },

    /**
     * Set session data from "connected" event
     */
    setSessionData(state, action) {
      const { sessionId, pId, userId, workerId, timestamp } = action.payload;

      if (sessionId) state.sessionId = sessionId;
      if (pId) state.pId = pId;
      if (userId) state.userId = userId;
      if (workerId) state.workerId = workerId;

      // Update status to streaming once session is established
      if (state.status === "idle") {
        state.status = "streaming";
      }
    },

    /**
     * Add a new log entry
     */
    addLog(state, action) {
      const logEntry = action.payload;

      // O(1) duplicate checking via lookup maps
      // Check by ID
      if (logEntry.id && state.logIdMap[logEntry.id]) {
        return;
      }

      // Check by author + timestamp for socket events
      const authorTimestampKey =
        logEntry.author && logEntry.timestamp
          ? `${logEntry.author}::${logEntry.timestamp}`
          : null;
      if (authorTimestampKey && state.logAuthorTimestampMap[authorTimestampKey]) {
        return;
      }

      // Browser workers are never duplicates at add time — updateLog handles them
      const isBrowserWorker = logEntry.author?.startsWith("browser_worker_");

      // Check for user message content duplicates within 10s window
      const isUserMessageDuplicate =
        !isBrowserWorker &&
        logEntry.author === "user" &&
        logEntry.user_message &&
        state.logs.some((log) => {
          if (log.author !== "user") return false;
          if (
            log.user_message !== logEntry.user_message &&
            log.content !== logEntry.user_message &&
            log.text !== logEntry.user_message
          ) {
            return false;
          }
          return (
            Math.abs(
              new Date(log.timestamp).getTime() -
                new Date(logEntry.timestamp).getTime(),
            ) < 10000
          );
        });

      if (!isUserMessageDuplicate) {
        state.logs.push(logEntry);

        // Record in O(1) lookup maps
        if (logEntry.id) {
          state.logIdMap[logEntry.id] = true;
        }
        if (authorTimestampKey) {
          state.logAuthorTimestampMap[authorTimestampKey] = true;
        }

        // Update derived state
        state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
        state.completedPhases = deriveCompletedPhases(state.logs, state.slides);
      }
    },

    /**
     * Update an existing log entry (for browser workers)
     */
    updateLog(state, action) {
      const { logIndex, logEntry } = action.payload;

      if (logIndex >= 0 && logIndex < state.logs.length) {
        const existingLog = state.logs[logIndex];

        // Smart merge for browser workers - don't lose existing data
        if (existingLog.author?.startsWith("browser_worker_")) {
          const mergedLog = {
            ...existingLog,
            ...logEntry,
            // Merge links arrays (avoid duplicates)
            links: [
              ...(existingLog.links || []),
              ...(logEntry.links || []).filter(
                (newLink) =>
                  !existingLog.links?.some(
                    (existingLink) => existingLink.url === newLink.url,
                  ),
              ),
            ],
            // Keep summary if already exists (don't overwrite with null)
            summary: logEntry.summary || existingLog.summary,
          };

          state.logs[logIndex] = mergedLog;
        } else {
          state.logs[logIndex] = logEntry;
        }

        // Update derived state
        state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
        state.completedPhases = deriveCompletedPhases(state.logs, state.slides);
      } else {
        console.error("[Redux] ❌ Invalid log index for update:", logIndex);
      }
    },

    /**
     * Set metadata (title, totalSlides) from presentation spec extractor
     */
    setMetadata(state, action) {
      const { title, totalSlides } = action.payload;

      if (title !== undefined) state.title = title;
      if (totalSlides !== undefined) state.totalSlides = totalSlides;
    },

    /**
     * Add or update a slide entry
     */
    updateSlide(state, action) {
      const { type, slideIndex, slideEntry } = action.payload;

      if (type === "update") {
        if (
          slideIndex !== undefined &&
          slideIndex >= 0 &&
          slideIndex < state.slides.length
        ) {
          const existingSlide = state.slides[slideIndex];

          // Smart merge - don't overwrite existing data with null/undefined
          const mergedSlide = {
            ...existingSlide,
            thinking: slideEntry.thinking || existingSlide.thinking,
            htmlContent: slideEntry.htmlContent || existingSlide.htmlContent,
            lastUpdated: slideEntry.lastUpdated || new Date().toISOString(),
            // Recalculate completion status
            isComplete: !!(
              (slideEntry.thinking || existingSlide.thinking) &&
              (slideEntry.htmlContent || existingSlide.htmlContent)
            ),
          };

          state.slides[slideIndex] = mergedSlide;
        } else {
          console.error(
            "[Redux] ❌ Invalid slideIndex for update:",
            slideIndex,
          );
        }
      } else if (type === "create") {
        // Check if slide already exists
        const existingIndex = state.slides.findIndex(
          (s) => s.slideNumber === slideEntry.slideNumber,
        );

        if (existingIndex !== -1) {
          console.warn(
            "[Redux] ⚠️ Slide already exists (from history), merging instead:",
            slideEntry.slideNumber,
          );

          const existingSlide = state.slides[existingIndex];

          // Merge new data with existing
          state.slides[existingIndex] = {
            ...existingSlide,
            thinking: slideEntry.thinking || existingSlide.thinking,
            htmlContent: slideEntry.htmlContent || existingSlide.htmlContent,
            lastUpdated: slideEntry.lastUpdated || new Date().toISOString(),
            isComplete: !!(
              (slideEntry.thinking || existingSlide.thinking) &&
              (slideEntry.htmlContent || existingSlide.htmlContent)
            ),
          };

        } else {
          // Truly new slide
          state.slides.push(slideEntry);
          state.slides.sort((a, b) => a.slideNumber - b.slideNumber);
        }
      } else {
        console.error("[Redux] ❌ Invalid update type:", type);
      }

      // Update derived state
      state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
      state.completedPhases = deriveCompletedPhases(state.logs, state.slides);
    },

    /**
     * Insert a new slide at a specific index and reorder existing slides
     * Optimized O(n) operation for slide reordering
     *
     * @param {Object} action.payload
     * @param {number} action.payload.insertIndex - Position to insert at (slideNumber)
     * @param {Object} action.payload.slideEntry - New slide entry to insert
     */
    insertSlide(state, action) {
      const { insertIndex, slideEntry } = action.payload;

      // Check if slide already exists at this number
      const existingIndex = state.slides.findIndex(
        (s) => s.slideNumber === insertIndex,
      );

      if (existingIndex !== -1) {
        // Slide exists - this is an insertion, need to reorder

        // Renumber all slides at and after insertion point
        // O(n) operation - single pass through array
        const reorderedSlides = state.slides.map((slide) => {
          if (slide.slideNumber >= insertIndex) {
            const newSlideNumber = slide.slideNumber + 1;
            return {
              ...slide,
              slideNumber: newSlideNumber,
              author: `enhanced_slide_generator_${newSlideNumber}`,
            };
          }
          return slide;
        });

        // Insert new slide at correct position (maintain sorted order)
        // Find the position where slideNumber matches insertIndex
        const insertPosition = reorderedSlides.findIndex(
          (s) => s.slideNumber > insertIndex,
        );

        if (insertPosition === -1) {
          // Insert at end
          reorderedSlides.push(slideEntry);
        } else {
          // Insert at correct position
          reorderedSlides.splice(insertPosition, 0, slideEntry);
        }

        // Update state
        state.slides = reorderedSlides;
      } else {
        // No conflict - just insert at correct position
        // Find insertion point (maintain sorted order)
        let insertPosition = state.slides.findIndex(
          (s) => s.slideNumber > insertIndex,
        );

        if (insertPosition === -1) {
          insertPosition = state.slides.length; // Append at end
        }

        state.slides.splice(insertPosition, 0, slideEntry);
      }

      // Update derived state
      state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
      state.completedPhases = deriveCompletedPhases(state.logs, state.slides);

      // Update totalSlides if needed
      if (state.slides.length > state.totalSlides) {
        state.totalSlides = state.slides.length;
      }
    },

    /**
     * Set presentation status (completed, failed, etc.)
     */
    setStatus(state, action) {
      const { status, presentationStatus, error } = action.payload;

      if (status !== undefined) state.status = status;
      if (presentationStatus !== undefined)
        state.presentationStatus = presentationStatus;
      if (error !== undefined) state.error = error;

      // Update completed phases
      if (status === "completed" || presentationStatus === "completed") {
        if (!state.completedPhases.includes("completed")) {
          state.completedPhases = [...state.completedPhases, "completed"];
        }
      }
    },

    /**
     * Legacy: Set entire presentation state (for history loading)
     */
    setPresentationState(state, action) {
      const {
        logs,
        slides,
        status,
        presentationStatus,
        title,
        totalSlides,
        error,
        progress,
        _replaceArrays,
      } = action.payload;

      // Handle array replacement (for history loading)
      if (_replaceArrays) {
        // REPLACE mode: Overwrite existing data
        if (logs !== undefined) {
          state.logs = logs;
        }
        if (slides !== undefined) {
          state.slides = slides;
        }
      } else {
        // APPEND mode: Add new data without duplicates
        if (logs && logs.length > 0) {
          const existingLogIds = new Set(state.logs.map((log) => log.id));
          const newLogs = logs.filter((log) => !existingLogIds.has(log.id));
          state.logs = [...state.logs, ...newLogs];
        }

        if (slides && slides.length > 0) {
          const existingSlideNumbers = new Set(
            state.slides.map((s) => s.slideNumber),
          );
          const newSlides = slides.filter(
            (s) => !existingSlideNumbers.has(s.slideNumber),
          );

          const allSlides = [...state.slides, ...newSlides];
          state.slides = allSlides.sort(
            (a, b) => a.slideNumber - b.slideNumber,
          );
        }
      }

      // Update scalar values
      if (status !== undefined) state.status = status;
      if (presentationStatus !== undefined)
        state.presentationStatus = presentationStatus;
      if (title !== undefined) state.title = title;
      if (totalSlides !== undefined) state.totalSlides = totalSlides;
      if (error !== undefined) state.error = error;
      if (progress !== undefined) state.progress = progress;

      // Update derived state
      state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
      state.completedPhases = deriveCompletedPhases(state.logs, state.slides);
    },

    /**
     * Reset presentation state to initial
     */
    resetPresentationState(state) {
      Object.assign(state, initialState);
    },

    /**
     * Set current slide ID
     */
    setCurrentSlideId(state, action) {
      const { presentationId } = action.payload;
      state.slideCurrentId = presentationId || state.slideCurrentId;
    },
  },
});

/**
 * Derive current phase based on latest logs and slides
 * @param {Array} logs - Array of log entries
 * @param {Array} slides - Array of slide entries
 * @returns {string} Current phase name
 */
function deriveCurrentPhase(logs, slides) {
  if (!logs || logs.length === 0) {
    return "planning";
  }

  const latestLog = logs[logs.length - 1];

  // Check if we have slides being generated
  if (slides && slides.length > 0) {
    return "generation";
  }

  // Check phase from latest log
  if (latestLog.phase === "research") {
    return "research";
  }

  if (latestLog.phase === "planning") {
    return "planning";
  }

  if (latestLog.phase === "generation") {
    return "generation";
  }

  return "planning";
}

/**
 * Derive completed phases based on logs and slides
 * @param {Array} logs - Array of log entries
 * @param {Array} slides - Array of slide entries
 * @returns {Array} Array of completed phase names
 */
function deriveCompletedPhases(logs, slides) {
  const completed = new Set();

  if (!logs) return [];

  // Check for planning phase
  const hasPlanningLog = logs.some(
    (log) =>
      log.author === "presentation_spec_extractor_agent" ||
      log.author === "lightweight_planning_agent",
  );
  if (hasPlanningLog) {
    completed.add("planning");
  }

  // Check for research phase
  const hasResearchLog = logs.some(
    (log) =>
      log.author === "KeywordResearchAgent" ||
      log.author?.startsWith("browser_worker_"),
  );
  if (hasResearchLog) {
    completed.add("research");
  }

  // Check for generation phase
  if (slides && slides.length > 0) {
    completed.add("generation");
  }

  // Check if all slides are complete
  const allSlidesComplete = slides?.every((slide) => slide.isComplete);
  if (allSlidesComplete && slides?.length > 0) {
    completed.add("completed");
  }

  return Array.from(completed);
}

// Export actions
export const {
  setSessionData,
  addLog,
  updateLog,
  setMetadata,
  updateSlide,
  insertSlide,
  setStatus,
  setPresentationState,
  resetPresentationState,
  setCurrentSlideId,
  setHistoryData,
} = presentationSlice.actions;

// Selectors
export const selectPresentation = (state) => {
  if (!state || !state.presentation) {
    console.warn(
      "Presentation state not found in Redux store, returning initial state",
    );
    return initialState;
  }
  return state.presentation;
};

export const selectSessionData = (state) => {
  const presentation = selectPresentation(state);
  return {
    sessionId: presentation.sessionId,
    pId: presentation.pId,
    userId: presentation.userId,
    workerId: presentation.workerId,
  };
};

export const selectLogs = (state) => selectPresentation(state).logs;
export const selectSlides = (state) => selectPresentation(state).slides;
export const selectPresentationStatus = (state) =>
  selectPresentation(state).status;
export const selectTitle = (state) => selectPresentation(state).title;
export const selectTotalSlides = (state) =>
  selectPresentation(state).totalSlides;
export const selectCurrentPhase = (state) =>
  selectPresentation(state).currentPhase;
export const selectCompletedPhases = (state) =>
  selectPresentation(state).completedPhases;

// Memoized selector factories for logs by phase — avoids new array refs on re-renders
const _selectLogsByPhaseCache = {};
export const selectLogsByPhase = (phase) => {
  if (!_selectLogsByPhaseCache[phase]) {
    _selectLogsByPhaseCache[phase] = createSelector(
      [selectLogs],
      (logs) => logs.filter((log) => log.phase === phase),
    );
  }
  return _selectLogsByPhaseCache[phase];
};

// Memoized selector factory for slide by number
const _selectSlideByNumberCache = {};
export const selectSlideByNumber = (slideNumber) => {
  if (!_selectSlideByNumberCache[slideNumber]) {
    _selectSlideByNumberCache[slideNumber] = createSelector(
      [selectSlides],
      (slides) => slides.find((slide) => slide.slideNumber === slideNumber),
    );
  }
  return _selectSlideByNumberCache[slideNumber];
};

// Memoized selector for browser worker logs
export const selectBrowserWorkerLogs = createSelector([selectLogs], (logs) =>
  logs.filter((log) => log.author?.startsWith("browser_worker_")),
);

// Memoized selector for completed slides
export const selectCompletedSlides = createSelector([selectSlides], (slides) =>
  slides.filter((slide) => slide.isComplete),
);

export const selectLogsByType = (messageType) =>
  createSelector([selectLogs], (logs) =>
    logs.filter((log) => log.messageType === messageType),
  );

// Separate user and agent messages with single pass
export const selectCategorizedLogs = createSelector([selectLogs], (logs) => {
  const userMessages = [];
  const agentMessages = [];

  for (const log of logs) {
    if (log.author === "user") {
      userMessages.push(log);
    } else {
      agentMessages.push(log);
    }
  }

  return { userMessages, agentMessages };
});

// Get only user messages
export const selectUserMessages = createSelector(
  [selectCategorizedLogs],
  (categorized) => categorized.userMessages,
);

// Get only agent messages
export const selectAgentMessages = createSelector(
  [selectCategorizedLogs],
  (categorized) => categorized.agentMessages,
);

export default presentationSlice.reducer;
