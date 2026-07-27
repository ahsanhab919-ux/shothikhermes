import { createSlice } from "@reduxjs/toolkit";

let activeChatId = null;
if (typeof window !== "undefined") {
  try {
    activeChatId = sessionStorage.getItem("activeResearchChatId");
    // Clear stale session data on page load
    if (
      activeChatId &&
      !window.location.search.includes(`id=${activeChatId}`)
    ) {
      sessionStorage.removeItem("activeResearchChatId");
      activeChatId = null;
    }
  } catch (error) {
    console.error("Error accessing sessionStorage:", error);
  }
}

const initialState = {
  currentChatId: activeChatId,
  messages: [],
  title: "",
  isEditing: false,
};

export const researchChatSlice = createSlice({
  name: "researchChat",
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateTitle: (state, action) => {
      state.title = action.payload;
    },
    setEditing: (state, action) => {
      state.isEditing = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearResearchChatState: (state) => {
      state.currentChatId = null;
      state.messages = [];
      state.title = "";
      state.isEditing = false;
    },
  },
});

export const {
  setCurrentChat,
  addMessage,
  updateTitle,
  setEditing,
  clearMessages,
  clearResearchChatState,
} = researchChatSlice.actions;

export const researchChatState = (state) => {
  if (!state || !state.researchChat) {
    console.warn("researchChat state is undefined");
    return initialState;
  }

  return state.researchChat;
};

export default researchChatSlice.reducer;
