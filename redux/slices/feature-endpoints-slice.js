import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  featureEndpoints: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const featureEndpointsSlice = createSlice({
  name: "feature_endpoints",
  initialState,
  reducers: {
    setFeatureEndpoints: (state, action) => {
      state.featureEndpoints = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setFeatureEndpointsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setFeatureEndpointsError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearFeatureEndpoints: (state) => {
      state.featureEndpoints = [];
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const {
  setFeatureEndpoints,
  setFeatureEndpointsLoading,
  setFeatureEndpointsError,
  clearFeatureEndpoints,
} = featureEndpointsSlice.actions;

export default featureEndpointsSlice.reducer;

