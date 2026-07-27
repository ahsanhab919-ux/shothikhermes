import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  headerHeight: 20,
  uploadedFiles: [],
  isUploading: false,
};

export const researchUiSlice = createSlice({
  name: "researchUi",
  initialState,
  reducers: {
    setHeaderHeight: (state, action) => {
      state.headerHeight = action.payload;
    },
    addUploadedFile: (state, action) => {
      state.uploadedFiles.push(action.payload);
    },
    removeUploadedFile: (state, action) => {
      state.uploadedFiles = state.uploadedFiles.filter(
        (_, index) => index !== action.payload,
      );
    },
    setUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    clearUploadedFiles: (state) => {
      state.uploadedFiles = [];
    },
    clearResearchUiState: (state) => {
      state.headerHeight = 20;
      state.uploadedFiles = [];
      state.isUploading = false;
    },
  },
});

export const {
  setHeaderHeight,
  setDarkMode,
  addUploadedFile,
  removeUploadedFile,
  setUploading,
  clearUploadedFiles,
  clearResearchUiState,
} = researchUiSlice.actions;

export default researchUiSlice.reducer;
