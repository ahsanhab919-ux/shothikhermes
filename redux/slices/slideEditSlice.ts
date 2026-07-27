import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Types for slide editing state
 */
export interface Change {
  id: string;
  slideId: string;
  elementId: string;
  type: "text" | "style" | "position" | "delete" | "duplicate";
  timestamp: string;
  data: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}

export interface ElementData {
  id: string;
  tagName: string;
  className: string | null;
  textContent: string;
  elementPath: string;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  computedStyles: Record<string, string>;
}

export interface SlideEditState {
  // Per-slide editing state
  editingSlides: {
    [slideId: string]: {
      isEditing: boolean;
      hasUnsavedChanges: boolean;
      lastSavedAt: string | null;
      changeHistory: Change[];
      currentHistoryIndex: number;
    };
  };

  // Active editing operations
  activeOperations: {
    [slideId: string]: {
      selectedElement: ElementData | null;
      editingMode: "text" | "style" | "position" | null;
    };
  };

  // Performance metrics
  performance: {
    operationCount: number;
    averageOperationTime: number;
    lastOperationTime: number | null;
  };
}

const initialState: SlideEditState = {
  editingSlides: {},
  activeOperations: {},
  performance: {
    operationCount: 0,
    averageOperationTime: 0,
    lastOperationTime: null,
  },
};

const slideEditSlice = createSlice({
  name: "slideEdit",
  initialState,
  reducers: {
    /**
     * Start editing a slide
     * Preserves existing state (including hasUnsavedChanges) if it exists
     */
    startEditing: (state, action: PayloadAction<{ slideId: string }>) => {
      const { slideId } = action.payload;

      if (!state.editingSlides[slideId]) {
        state.editingSlides[slideId] = {
          isEditing: true,
          hasUnsavedChanges: false,
          lastSavedAt: null,
          changeHistory: [],
          currentHistoryIndex: -1,
        };
      } else {
        // Preserve existing state, only update isEditing flag
        state.editingSlides[slideId].isEditing = true;
        // Don't reset hasUnsavedChanges - preserve it if it was true
      }
    },

    /**
     * Stop editing a slide
     */
    stopEditing: (state, action: PayloadAction<{ slideId: string }>) => {
      const { slideId } = action.payload;

      if (state.editingSlides[slideId]) {
        state.editingSlides[slideId].isEditing = false;
      }

      // Clear active operations
      if (state.activeOperations[slideId]) {
        delete state.activeOperations[slideId];
      }
    },

    /**
     * Track a change to a slide
     */
    trackChange: (
      state,
      action: PayloadAction<{
        slideId: string;
        elementId: string;
        type: Change["type"];
        data: Record<string, unknown>;
        previousData?: Record<string, unknown>;
      }>,
    ) => {
      const { slideId, elementId, type, data, previousData } = action.payload;

      // Ensure slide state exists before tracking change
      if (!state.editingSlides[slideId]) {
        state.editingSlides[slideId] = {
          isEditing: true,
          hasUnsavedChanges: false,
          lastSavedAt: null,
          changeHistory: [],
          currentHistoryIndex: -1,
        };
      }

      const slide = state.editingSlides[slideId];

      // Ensure isEditing is true when tracking changes
      if (!slide.isEditing) {
        slide.isEditing = true;
      }

      // Create change object
      const change: Change = {
        id: `${slideId}-${Date.now()}-${Math.random()}`,
        slideId,
        elementId,
        type,
        timestamp: new Date().toISOString(),
        data,
        previousData,
      };

      // Remove any changes after current index (when undoing and making new changes)
      if (slide.currentHistoryIndex < slide.changeHistory.length - 1) {
        slide.changeHistory = slide.changeHistory.slice(
          0,
          slide.currentHistoryIndex + 1,
        );
      }

      // Check if we need to remove oldest change (circular buffer)
      const MAX_HISTORY = 50;
      if (slide.changeHistory.length >= MAX_HISTORY) {
        // Remove oldest change
        slide.changeHistory.shift();

        // Adjust currentHistoryIndex before adding new change
        // If we removed a change, all indices shift down by 1
        if (slide.currentHistoryIndex >= 0) {
          slide.currentHistoryIndex -= 1;
        }
        // If currentHistoryIndex was -1 (no history), it stays -1
      }

      // Add new change to end
      slide.changeHistory.push(change);
      slide.currentHistoryIndex = slide.changeHistory.length - 1;
      // Always set hasUnsavedChanges to true when tracking a change
      slide.hasUnsavedChanges = true;
    },

    /**
     * Set selected element for a slide
     */
    setSelectedElement: (
      state,
      action: PayloadAction<{
        slideId: string;
        element: ElementData | null;
      }>,
    ) => {
      const { slideId, element } = action.payload;

      if (!state.activeOperations[slideId]) {
        state.activeOperations[slideId] = {
          selectedElement: null,
          editingMode: null,
        };
      }

      state.activeOperations[slideId].selectedElement = element;
    },

    /**
     * Set editing mode for a slide
     */
    setEditingMode: (
      state,
      action: PayloadAction<{
        slideId: string;
        mode: "text" | "style" | "position" | null;
      }>,
    ) => {
      const { slideId, mode } = action.payload;

      if (!state.activeOperations[slideId]) {
        state.activeOperations[slideId] = {
          selectedElement: null,
          editingMode: null,
        };
      }

      state.activeOperations[slideId].editingMode = mode;
    },

    /**
     * Mark slide as saved
     */
    markSaved: (
      state,
      action: PayloadAction<{
        slideId: string;
        savedAt?: string;
        version?: number;
      }>,
    ) => {
      const { slideId, savedAt, version } = action.payload;

      if (state.editingSlides[slideId]) {
        state.editingSlides[slideId].hasUnsavedChanges = false;
        state.editingSlides[slideId].lastSavedAt =
          savedAt || new Date().toISOString();
      }
    },

    /**
     * Set save status
     */
    setSaveStatus: (
      state,
      action: PayloadAction<{
        slideId: string;
        status: "idle" | "saving" | "saved" | "error";
        error?: string;
      }>,
    ) => {
      const { slideId, status, error } = action.payload;

      if (!state.editingSlides[slideId]) {
        state.editingSlides[slideId] = {
          isEditing: false,
          hasUnsavedChanges: false,
          lastSavedAt: null,
          changeHistory: [],
          currentHistoryIndex: -1,
        };
      }

      // Store save status (can be extended to include error details)
      if (status === "error" && error) {
        // Store error in state if needed
        console.error("Save error for slide", slideId, error);
      }
    },

    /**
     * Undo last change
     */
    undo: (state, action: PayloadAction<{ slideId: string }>) => {
      const { slideId } = action.payload;
      const slide = state.editingSlides[slideId];

      if (slide && slide.currentHistoryIndex >= 0) {
        slide.currentHistoryIndex -= 1;
        slide.hasUnsavedChanges = true;
      }
    },

    /**
     * Redo last undone change
     */
    redo: (state, action: PayloadAction<{ slideId: string }>) => {
      const { slideId } = action.payload;
      const slide = state.editingSlides[slideId];

      if (slide && slide.currentHistoryIndex < slide.changeHistory.length - 1) {
        slide.currentHistoryIndex += 1;
        slide.hasUnsavedChanges = true;
      }
    },

    /**
     * Track performance metrics
     */
    trackPerformance: (
      state,
      action: PayloadAction<{
        operationTime: number;
      }>,
    ) => {
      const { operationTime } = action.payload;
      const perf = state.performance;

      perf.operationCount += 1;
      perf.lastOperationTime = operationTime;

      // Calculate rolling average
      const totalTime =
        perf.averageOperationTime * (perf.operationCount - 1) + operationTime;
      perf.averageOperationTime = totalTime / perf.operationCount;
    },

    /**
     * Clear change history for a slide
     */
    clearHistory: (state, action: PayloadAction<{ slideId: string }>) => {
      const { slideId } = action.payload;

      if (state.editingSlides[slideId]) {
        state.editingSlides[slideId].changeHistory = [];
        state.editingSlides[slideId].currentHistoryIndex = -1;
      }
    },

    /**
     * Reset all editing state (for cleanup)
     */
    reset: () => initialState,
  },
});

// Export actions
export const {
  startEditing,
  stopEditing,
  trackChange,
  setSelectedElement,
  setEditingMode,
  markSaved,
  setSaveStatus,
  undo,
  redo,
  trackPerformance,
  clearHistory,
  reset,
} = slideEditSlice.actions;

// Selectors
export const selectSlideEditState = (state: { slideEdit: SlideEditState }) =>
  state.slideEdit;

export const selectEditingSlide = (slideId: string) =>
  createSelector(
    [selectSlideEditState],
    (editState) => editState.editingSlides[slideId] || null,
  );

export const selectActiveOperation = (slideId: string) =>
  createSelector(
    [selectSlideEditState],
    (editState) => editState.activeOperations[slideId] || null,
  );

export const selectChangeHistory = (slideId: string) =>
  createSelector([selectEditingSlide(slideId)], (slide) => {
    if (!slide) return [];
    return slide.changeHistory.slice(0, slide.currentHistoryIndex + 1);
  });

export const selectCanUndo = (slideId: string) =>
  createSelector([selectEditingSlide(slideId)], (slide) => {
    if (!slide) return false;
    return slide.currentHistoryIndex >= 0;
  });

export const selectCanRedo = (slideId: string) =>
  createSelector([selectEditingSlide(slideId)], (slide) => {
    if (!slide) return false;
    return (
      slide.currentHistoryIndex < slide.changeHistory.length - 1 &&
      slide.changeHistory.length > 0
    );
  });

export const selectCurrentHistoryIndex = (slideId: string) =>
  createSelector([selectEditingSlide(slideId)], (slide) => {
    if (!slide) return -1;
    return slide.currentHistoryIndex;
  });

export const selectPerformanceMetrics = createSelector(
  [selectSlideEditState],
  (editState) => editState.performance,
);

export default slideEditSlice.reducer;
