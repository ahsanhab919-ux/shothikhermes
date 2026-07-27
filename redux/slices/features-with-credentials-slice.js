import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  features: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const featuresWithCredentialsSlice = createSlice({
  name: "features_with_credentials",
  initialState,
  reducers: {
    setFeaturesWithCredentials: (state, action) => {
      state.features = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setFeaturesLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setFeaturesError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearFeatures: (state) => {
      state.features = [];
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const {
  setFeaturesWithCredentials,
  setFeaturesLoading,
  setFeaturesError,
  clearFeatures,
} = featuresWithCredentialsSlice.actions;

export default featuresWithCredentialsSlice.reducer;

