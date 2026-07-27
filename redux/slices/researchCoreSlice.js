import { createSlice } from "@reduxjs/toolkit";

// Helper function to create event hash for deduplication
const createEventHash = (event) => {
  if (!event) return null;
  return `${event.step || "unknown"}-${event.message || ""}-${event.timestamp || Date.now()}`;
};

// Helper function to check if event should be added
const shouldAddEvent = (currentEvents, newEvent) => {
  if (!newEvent) return false;

  const newEventHash = createEventHash(newEvent);
  if (!newEventHash) return false;

  // Check if we already have this exact event
  const isDuplicate = currentEvents.some(
    (event) => createEventHash(event) === newEventHash,
  );

  return !isDuplicate;
};

const initialState = {
  currentResearch: null,
  researches: [], // Each research object will now contain its own sources, images, and selectedTab
  activeResearchIndex: 0,
  streamEvents: [],
  isStreaming: false,
  error: null,
  jobId: null,
  streamingMessage: "",
  isPolling: false,
  connectionStatus: "disconnected", // 'connected', 'polling', 'reconnecting', 'failed', 'timeout',
  userPrompt: "",
  lastEventTimestamp: null,
  eventSequenceNumber: 0,
  isSimulating: false,
  simulationStatus: "idle", // "idle" | "ongoing" | "completed"
};

export const researchCoreSlice = createSlice({
  name: "researchCore",
  initialState,
  reducers: {
    startStreaming: (state, action) => {
      state.isStreaming = true;
      state.isPolling = false;
      state.jobId = action.payload.jobId;
      state.error = null;
      state.streamEvents = []; // Reset events for new research
      state.lastEventTimestamp = null;
      state.eventSequenceNumber = 0;
      state.connectionStatus = "connecting";
    },
    addStreamEvent: (state, action) => {
      const newEvent = action.payload;

      // Adding comprehensive deduplication logic
      if (!shouldAddEvent(state.streamEvents, newEvent)) {
        return; // Exit early without modifying state
      }

      // Adding sequence number and timestamp tracking
      const eventWithMetadata = {
        ...newEvent,
        sequenceNumber: state.eventSequenceNumber++,
        receivedAt: Date.now(),
      };

      // Limitting stream events to prevent memory issues (keep last 100 events)
      if (state.streamEvents.length >= 100) {
        state.streamEvents = state.streamEvents.slice(-99);
      }

      state.streamEvents.push(eventWithMetadata);
      state.lastEventTimestamp = Date.now();
    },
    updateStreamingMessage: (state, action) => {
      state.streamingMessage += action.payload;
    },
    setUserPrompt: (state, action) => {
      state.userPrompt = action.payload;
    },
    // finishResearch: (state, action) => {
    //   state.isStreaming = false;
    //   state.isPolling = false;
    //   state.connectionStatus = "connected";
    //   const newResearch = {
    //     ...action.payload,
    //     sources: action.payload.sources || [],
    //     images: action.payload.images || [],
    //     selectedTab: 0,
    //     status: "completed",
    //   };

    //   // Check if research already exists before adding
    //   const existingIndex = state.researches.findIndex(
    //     (research) => research._id === newResearch._id
    //   );

    //   if (existingIndex >= 0) {
    //     // Update existing research instead of adding duplicate
    //     state.researches[existingIndex] = newResearch;
    //     state.currentResearch = newResearch;
    //   } else {
    //     // Add new research only if it doesn't exist
    //     state.currentResearch = newResearch;
    //     state.researches.push(newResearch);
    //   }
    // },
    finishResearch: (state, action) => {
      const research = {
        ...action.payload,
        selectedTab: 0, // Default to first tab
        completedAt: Date.now(),
      };

      // Check for duplicates by ID
      const existingIndex = state.researches.findIndex(
        (r) => r._id === research._id,
      );
      if (existingIndex >= 0) {
        // Update existing research instead of adding duplicate
        state.researches[existingIndex] = research;
      } else {
        state.researches.push(research);
      }

      // Clear streaming state
      state.isStreaming = false;
      state.isPolling = false;
      state.jobId = null;
      state.streamEvents = []; // Clear events after completion
      state.connectionStatus = "connected";
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isStreaming = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetResearchCore: (state) => {
      state.currentResearch = null;
      state.researches = [];
      state.activeResearchIndex = 0;
      state.jobId = null;
      state.streamEvents = [];
      state.isStreaming = false;
      state.error = null;
      state.streamingMessage = "";
    },
    loadExistingResearches: (state, action) => {
      state.researches = action.payload.map((research) => ({
        ...research,
        sources: research.sources || [],
        images: research.images || [],
        selectedTab: research.selectedTab || 0, // Initialize selectedTab if not present
      }));
      if (state.researches.length > 0) {
        state.currentResearch = state.researches[0];
      }
    },
    setActiveResearch: (state, action) => {
      const index = action.payload;
      state.activeResearchIndex = index;
      state.currentResearch = state.researches[index];
    },
    setResearchSelectedTab: (state, action) => {
      const { researchId, selectedTab } = action.payload;
      const researchToUpdate = state.researches.find(
        (research) => research._id === researchId,
      );
      if (researchToUpdate) {
        researchToUpdate.selectedTab = selectedTab;
      }
      if (state.currentResearch && state.currentResearch._id === researchId) {
        state.currentResearch.selectedTab = selectedTab;
      }
    },
    setPollingMode: (state, action) => {
      state.isPolling = action.payload;
      if (!action.payload) {
        // Clear polling-related state when stopping polling
        state.streamEvents = [];
        state.lastEventTimestamp = null;
        state.eventSequenceNumber = 0;
      }
    },
    setStreamingMode: (state, action) => {
      state.isStreaming = action.payload || false;
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload; // 'connected', 'polling', 'reconnecting', 'failed', 'timeout'
    },
    setSimulationStatus: (state, action) => {
      state.simulationStatus = action.payload; //
    },
    setIsSimulating: (state, action) => {
      state.isSimulating = action.payload;
    },
    forceAddStreamEvent: (state, action) => {
      const eventWithMetadata = {
        ...action.payload,
        sequenceNumber: state.eventSequenceNumber++,
        receivedAt: Date.now(),
        forced: true,
      };

      if (state.streamEvents.length >= 100) {
        state.streamEvents = state.streamEvents.slice(-99);
      }

      state.streamEvents.push(eventWithMetadata);
      state.lastEventTimestamp = Date.now();
    },
  },
});

export const {
  startStreaming,
  addStreamEvent,
  updateStreamingMessage,
  finishResearch,
  setError,
  clearError,
  resetResearchCore,
  loadExistingResearches,
  setActiveResearch,
  setResearchSelectedTab,
  setPollingMode,
  setConnectionStatus,
  setStreamingMode,
  setUserPrompt,
  forceAddStreamEvent,
  setSimulationStatus,
  setIsSimulating,
} = researchCoreSlice.actions;

export const researchCoreState = (state) => {
  if (!state || !state.researchCore) {
    console.warn("researchCore state is undefined");
    return initialState;
  }

  return state.researchCore;
};

export default researchCoreSlice.reducer;
