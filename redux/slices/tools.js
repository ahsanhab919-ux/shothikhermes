import { createSlice } from "@reduxjs/toolkit";

const getInitialState = () => ({
  showAlert: false,
  alertMessage: "",
  agentHistoryMenu: false, // Controls the visibility of the agent history menu,
});

const toolsSlice = createSlice({
  name: "tools",
  initialState: getInitialState(),
  reducers: {
    setShowAlert: (state, action) => {
      state.showAlert = action.payload;
    },
    setAlertMessage: (state, action) => {
      state.alertMessage = action.payload;
    },
    setAgentHistoryMenu: (state, action) => {
      state.agentHistoryMenu = action.payload;
    },
  },
});

export const { setShowAlert, setAlertMessage, setAgentHistoryMenu } =
  toolsSlice.actions;

export default toolsSlice.reducer;
