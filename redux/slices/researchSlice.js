import { createSlice } from "@reduxjs/toolkit";

let activeChatId = null;
if (typeof window !== "undefined") {
  try {
    activeChatId = sessionStorage.getItem("activeChatId");
    // Clear stale session data on page load
    if (
      activeChatId &&
      !window.location.search.includes(`id=${activeChatId}`)
    ) {
      sessionStorage.removeItem("activeChatId");
      activeChatId = null;
    }
  } catch (error) {
    console.error("Error accessing sessionStorage:", error);
  }
}

const initialState = {
  title: "Ready to Generate",
  // New save points structure
  currentChatId: null, // Current chat ID
  activeChatIdForPolling: activeChatId || null,
};

const researchSlice = createSlice({
  name: "research",
  initialState,
  reducers: {
    setResearchToken,
  },
});
