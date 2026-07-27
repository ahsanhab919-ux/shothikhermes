import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  initialized: false,
  consent: false,
  events: [],
};

export const initializeAnalytics = createAsyncThunk(
  "analytics/initialize",
  async ({ consent }) => {
    return { consent };
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setConsent(state, action) {
      state.consent = action.payload;
    },
    trackEvent(state, action) {
      if (state.consent) {
        state.events.push(action.payload);
      }
    },
    setABTestVariant(state, action) {
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeAnalytics.fulfilled, (state, action) => {
      state.initialized = true;
      state.consent = action.payload.consent;
    });
  },
});

export const { setConsent, trackEvent, setABTestVariant } = analyticsSlice.actions;
export default analyticsSlice.reducer;
