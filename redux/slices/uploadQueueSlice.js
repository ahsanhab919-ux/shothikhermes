import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  files: [], // Array of upload items
  isModalOpen: false,
  stats: {
    total: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  },
};

const uploadQueueSlice = createSlice({
  name: "uploadQueue",
  initialState,
  reducers: {
    // Add files to queue
    addFiles: (state, action) => {
      const newFiles = action.payload.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        status: "idle", // idle | uploading | success | error
        progress: 0,
        downloadUrl: null,
        error: null,
        timestamp: Date.now(),
        // Paraphrase settings
        mode: file.mode,
        synonym: file.synonym,
        language: file.language,
        freezeWords: file.freezeWords || [],
      }));

      state.files.push(...newFiles);
      state.stats.total += newFiles.length;
    },

    // Update single file status
    updateFileStatus: (state, action) => {
      const { id, status, progress, downloadUrl, error } = action.payload;
      const file = state.files.find((f) => f.id === id);

      if (file) {
        const oldStatus = file.status;

        file.status = status;
        if (progress !== undefined) file.progress = progress;
        if (downloadUrl !== undefined) file.downloadUrl = downloadUrl;
        if (error !== undefined) file.error = error;

        // Update stats
        if (oldStatus !== status) {
          if (oldStatus === "uploading") state.stats.uploading--;
          if (oldStatus === "failed") state.stats.failed--;
          if (oldStatus === "error") state.stats.failed--; // Fix: ensure error decrement logic is consistent
          if (oldStatus === "success") state.stats.completed--; // Handle re-upload if ever needed

          if (status === "uploading") state.stats.uploading++;
          if (status === "success") state.stats.completed++;
          if (status === "error") state.stats.failed++;
        }
      }
    },

    // Remove file from queue
    removeFile: (state, action) => {
      const id = action.payload;
      const fileIndex = state.files.findIndex((f) => f.id === id);

      if (fileIndex !== -1) {
        const file = state.files[fileIndex];
        state.files.splice(fileIndex, 1);
        state.stats.total--;

        if (file.status === "uploading") state.stats.uploading--;
        if (file.status === "success") state.stats.completed--;
        if (file.status === "error") state.stats.failed--;
      }
    },

    // Clear completed files
    clearCompleted: (state) => {
      const completedCount = state.files.filter(
        (f) => f.status === "success",
      ).length;
      state.files = state.files.filter((f) => f.status !== "success");
      state.stats.completed -= completedCount;
      state.stats.total -= completedCount;
    },

    // Clear failed files
    clearFailed: (state) => {
      const failedCount = state.files.filter(
        (f) => f.status === "error",
      ).length;
      state.files = state.files.filter((f) => f.status !== "error");
      state.stats.failed -= failedCount;
      state.stats.total -= failedCount;
    },

    // Clear all files
    clearAll: (state) => {
      state.files = [];
      state.stats = {
        total: 0,
        uploading: 0,
        completed: 0,
        failed: 0,
      };
    },

    // Modal control
    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
  },
});

export const {
  addFiles,
  updateFileStatus,
  removeFile,
  clearCompleted,
  clearFailed,
  clearAll,
  setModalOpen,
} = uploadQueueSlice.actions;

// Selectors
export const selectAllFiles = (state) => state.uploadQueue.files;
export const selectUploadStats = (state) => state.uploadQueue.stats;
export const selectIsModalOpen = (state) => state.uploadQueue.isModalOpen;
export const selectActiveUploads = (state) =>
  state.uploadQueue.files.filter((f) => f.status === "uploading");
export const selectHasActiveUploads = (state) =>
  state.uploadQueue.files.some((f) => f.status === "uploading");
export const selectCompletedUploads = (state) =>
  state.uploadQueue.files.filter((f) => f.status === "success");

export default uploadQueueSlice.reducer;
