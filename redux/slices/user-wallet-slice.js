import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wallet: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const userWalletSlice = createSlice({
  name: "user_wallet",
  initialState,
  reducers: {
    setWallet: (state, action) => {
      state.wallet = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    setWalletLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setWalletError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateWalletToken: (state, action) => {
      if (state.wallet) {
        state.wallet.token = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    updateWalletPackage: (state, action) => {
      if (state.wallet) {
        state.wallet.package = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    updateWalletPlan: (state, action) => {
      if (state.wallet) {
        state.wallet.plan = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    updateWalletExpiresAt: (state, action) => {
      if (state.wallet) {
        state.wallet.expires_at = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },
    clearWallet: (state) => {
      state.wallet = null;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = null;
    },
  },
});

export const {
  setWallet,
  setWalletLoading,
  setWalletError,
  updateWalletToken,
  updateWalletPackage,
  updateWalletPlan,
  updateWalletExpiresAt,
  clearWallet,
} = userWalletSlice.actions;

export default userWalletSlice.reducer;

