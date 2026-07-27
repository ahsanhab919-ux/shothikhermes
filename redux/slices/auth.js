import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  sheetToken: null,
  researchToken: null,
  user: {},
  userLimit: [],
  isNewRegistered: false,
  showLoginModal: false,
  showRegisterModal: false,
  showForgotPasswordModal: false,
  _hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateAuth: (state) => {
      if (typeof window !== "undefined") {
        try {
          const at = localStorage.getItem("accessToken");
          const st = localStorage.getItem("sheetai-token");
          const rt = localStorage.getItem("research-token");
          if (at) state.accessToken = at;
          if (st) state.sheetToken = st;
          if (rt) state.researchToken = rt;
        } catch (e) {}
      }
      state._hydrated = true;
    },
    loggedIn: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = {};
      localStorage.removeItem("accessToken");
      localStorage.removeItem("sheetai-token");
      localStorage.removeItem("research-token");
    },
    getUser: (state, action) => {
      state.user = action.payload;
    },
    setUserLimit: (state, action) => {
      state.userLimit = action.payload;
    },
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setSheetToken: (state, action) => {
      state.sheetToken = action.payload;
    },
    setResearchToken: (state, action) => {
      state.researchToken = action.payload;
    },
    updateUser: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.user = { ...state.user, ...action.payload };
    },
    setIsNewRegistered: (state, action) => {
      state.isNewRegistered = action.payload;
    },
    setShowLoginModal: (state, action) => {
      state.showLoginModal = action.payload;
    },
    setShowRegisterModal: (state, action) => {
      state.showRegisterModal = action.payload;
    },
    setShowForgotPasswordModal: (state, action) => {
      state.showForgotPasswordModal = action.payload;
    },
  },
});

export const {
  hydrateAuth,
  loggedIn,
  logout,
  getUser,
  setUserLimit,
  setUser,
  setSheetToken,
  setResearchToken,
  updateUser,
  setIsNewRegistered,
  setShowLoginModal,
  setShowRegisterModal,
  setShowForgotPasswordModal,
} = authSlice.actions;

export default authSlice.reducer;
