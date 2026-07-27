import { createSlice } from "@reduxjs/toolkit";

const emptyChatState = () => ({
  logs: [],
  sheet: null,
  status: "idle",
  title: "Ready to Generate",
  savePoints: [],
  activeSavePointId: null,
  currentChatId: null,
  polling: { isPolling: false },
  streaming: { inFlight: false },
  lastConversationId: null,
});

const initialState = {
  activeChatId: null,
  activeStreamingChatId: null, // Track which chat has an active SSE stream
  byChatId: {},
};

const ensureChat = (state, chatId) => {
  if (!chatId) return null;
  if (!state.byChatId[chatId]) {
    state.byChatId[chatId] = emptyChatState();
    state.byChatId[chatId].currentChatId = chatId;
  }
  return state.byChatId[chatId];
};

const sheetSlice = createSlice({
  name: "sheet",
  initialState,
  reducers: {
    setActiveChatId(state, action) {
      state.activeChatId = action.payload || null;
    },

    setActiveStreamingChatId(state, action) {
      state.activeStreamingChatId = action.payload || null;
    },

    setSheetState(state, action) {
      const payload =
        typeof action.payload === "object" ? action.payload : { title: null };
      const { chatId, logs, sheet, status, title } = payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      if (logs !== undefined) chat.logs = logs;
      if (sheet !== undefined) chat.sheet = sheet;
      if (status !== undefined) chat.status = status;
      if (title !== undefined) chat.title = title;
    },

    setSheetData(state, action) {
      const payload =
        typeof action.payload === "object" && !Array.isArray(action.payload)
          ? action.payload
          : { sheet: action.payload };
      const { chatId, sheet } = payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.sheet = sheet;
      if (sheet === null) {
        chat.status = "idle";
      } else if (Array.isArray(sheet) && sheet.length > 0) {
        chat.status = "completed";
      }
    },

    setSheetStatus(state, action) {
      const payload =
        typeof action.payload === "object"
          ? action.payload
          : { status: action.payload };
      const { chatId, status } = payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.status = status;
    },

    setSheetTitle(state, action) {
      const payload =
        typeof action.payload === "object"
          ? action.payload
          : { title: action.payload };
      const { chatId, title } = payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.title = title;
    },

    setChatPolling(state, action) {
      const { chatId, isPolling } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.polling = { isPolling: Boolean(isPolling) };
    },

    initializeChatHistory(state, action) {
      const { chatId, chatHistory } = action.payload;
      const chat = ensureChat(state, chatId);
      if (!chat) return;
      chat.currentChatId = chatId;

      const savePoints = [];
      let currentSavePoint = null;

      chatHistory.forEach((message) => {
        if (message.isUser) {
          if (currentSavePoint) {
            savePoints.push(currentSavePoint);
          }

          currentSavePoint = {
            id: `savepoint-${message.id}`,
            title: message.message.substring(0, 50) + "...",
            prompt: message.message,
            timestamp: message.timestamp,
            generations: [],
            activeGenerationId: null,
          };
        } else if (currentSavePoint && !message.isUser) {
          const generation = {
            id: `gen-${message.id}`,
            title: `Generation ${currentSavePoint.generations.length + 1}`,
            timestamp: message.timestamp,
            sheetData: message.sheetData || null,
            status: message.type === "error" ? "error" : "completed",
            message: message.message,
          };

          currentSavePoint.generations.push(generation);

          if (!currentSavePoint.activeGenerationId) {
            currentSavePoint.activeGenerationId = generation.id;
          }
        }
      });

      if (currentSavePoint) {
        savePoints.push(currentSavePoint);
      }

      chat.savePoints = savePoints;

      if (savePoints.length > 0) {
        const lastSavePoint = savePoints[savePoints.length - 1];
        chat.activeSavePointId = lastSavePoint.id;

        const activeGeneration = lastSavePoint.generations.find(
          (gen) => gen.id === lastSavePoint.activeGenerationId,
        );
        if (activeGeneration && activeGeneration.sheetData) {
          chat.sheet = activeGeneration.sheetData;
          chat.status = activeGeneration.status;
          chat.title = lastSavePoint.title;
        }
      }
    },

    addSavePoint(state, action) {
      const { chatId, savePoint } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;

      const existingIndex = chat.savePoints.findIndex(
        (sp) => sp.id === savePoint.id,
      );

      if (existingIndex === -1) {
        chat.savePoints.push(savePoint);
        chat.activeSavePointId = savePoint.id;

        if (savePoint.generations.length > 0) {
          const activeGeneration = savePoint.generations.find(
            (gen) => gen.id === savePoint.activeGenerationId,
          );
          if (activeGeneration && activeGeneration.sheetData) {
            chat.sheet = activeGeneration.sheetData;
            chat.status = activeGeneration.status;
            chat.title = savePoint.title;
          }
        }
      } else {
        chat.savePoints[existingIndex] = savePoint;
      }
    },

    addGenerationToSavePoint(state, action) {
      const { chatId, savePointId, generation } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;

      const savePointIndex = chat.savePoints.findIndex(
        (sp) => sp.id === savePointId,
      );
      if (savePointIndex !== -1) {
        const savePoint = chat.savePoints[savePointIndex];

        const existingGenIndex = savePoint.generations.findIndex(
          (gen) => gen.id === generation.id,
        );

        if (existingGenIndex === -1) {
          savePoint.generations.push(generation);
        } else {
          savePoint.generations[existingGenIndex] = generation;
        }

        savePoint.activeGenerationId = generation.id;

        if (chat.activeSavePointId === savePointId) {
          if (generation.sheetData) {
            chat.sheet = generation.sheetData;
            chat.status = generation.status;
            chat.title = savePoint.title;
          }
        }
      }
    },

    switchToSavePoint(state, action) {
      const { chatId, savePointId } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.activeSavePointId = savePointId;

      const savePoint = chat.savePoints.find((sp) => sp.id === savePointId);
      if (savePoint) {
        chat.title = savePoint.title;

        const activeGeneration = savePoint.generations.find(
          (gen) => gen.id === savePoint.activeGenerationId,
        );

        if (activeGeneration) {
          chat.sheet = activeGeneration.sheetData;
          chat.status = activeGeneration.status;
        } else {
          chat.status = "idle";
        }
      }
    },

    switchToGeneration(state, action) {
      const { chatId, savePointId, generationId } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;

      const savePoint = chat.savePoints.find((sp) => sp.id === savePointId);
      if (!savePoint) return;

      const generation = savePoint.generations.find(
        (gen) => gen.id === generationId,
      );
      if (!generation) return;

      savePoint.activeGenerationId = generationId;

      if (chat.activeSavePointId === savePointId) {
        chat.sheet = generation.sheetData;
        chat.status = generation.status;
      }
    },

    generateMoreForSavePoint(state, action) {
      const { chatId, savePointId } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;

      if (chat.activeSavePointId === savePointId) {
        chat.status = "generating";
      }
    },

    addSheetLog(state, action) {
      const { chatId, ...rest } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.logs.push({
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        ...rest,
      });
    },

    clearSheetLogs(state, action) {
      const { chatId } = action.payload || {};
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.logs = [];
    },

    resetSheetState() {
      return { ...initialState };
    },

    loadConversationData(state, action) {
      const { chatId, conversationData } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.sheet = conversationData.rows;
      chat.status = "completed";
      chat.title = conversationData.title || "Loaded Conversation";
    },

    initializeSavePoints(state, action) {
      const { chatId, savePoints, activeSavePointId } = action.payload;
      const chat = ensureChat(state, chatId || state.activeChatId);
      if (!chat) return;
      chat.savePoints = savePoints;
      chat.activeSavePointId = activeSavePointId;

      if (activeSavePointId && savePoints.length > 0) {
        const activeSavePoint = savePoints.find(
          (sp) => sp.id === activeSavePointId,
        );
        if (activeSavePoint) {
          const activeGeneration = activeSavePoint.generations.find(
            (gen) => gen.id === activeSavePoint.activeGenerationId,
          );
          if (activeGeneration && activeGeneration.sheetData) {
            chat.sheet = activeGeneration.sheetData;
            chat.status = activeGeneration.status;
            chat.title = activeSavePoint.title;
          }
        }
      }
    },
  },
});

// Export action creators
export const {
  setActiveChatId,
  setActiveStreamingChatId,
  setSheetState,
  setSheetData,
  setSheetStatus,
  setSheetTitle,
  setChatPolling,
  initializeChatHistory,
  addSavePoint,
  addGenerationToSavePoint,
  switchToSavePoint,
  switchToGeneration,
  generateMoreForSavePoint,
  addSheetLog,
  clearSheetLogs,
  resetSheetState,
  initializeSavePoints,
} = sheetSlice.actions;

// Selectors
export const selectActiveChatId = (state) => state?.sheet?.activeChatId || null;

export const selectActiveStreamingChatId = (state) =>
  state?.sheet?.activeStreamingChatId || null;

const selectChatState = (state, chatId) => {
  const resolved = chatId || state?.sheet?.activeChatId;
  if (!resolved) return emptyChatState();
  return state?.sheet?.byChatId?.[resolved] || emptyChatState();
};

export const selectSheet = (state) => selectChatState(state, null);

export const selectSheetData = (state, chatId) =>
  selectChatState(state, chatId).sheet || null;

export const selectSheetStatus = (state, chatId) =>
  selectChatState(state, chatId).status;

export const selectSheetTitle = (state, chatId) =>
  selectChatState(state, chatId).title || "Ready to Generate";

export const selectSavePoints = (state, chatId) =>
  selectChatState(state, chatId).savePoints || [];

export const selectActiveSavePoint = (state, chatId) => {
  const chatState = selectChatState(state, chatId);
  const savePoints = chatState.savePoints || [];
  const activeSavePointId = chatState.activeSavePointId;
  return savePoints.find((sp) => sp.id === activeSavePointId) || null;
};

export const selectActiveGeneration = (state, chatId) => {
  const activeSavePoint = selectActiveSavePoint(state, chatId);
  if (!activeSavePoint) return null;

  return (
    activeSavePoint.generations.find(
      (gen) => gen.id === activeSavePoint.activeGenerationId,
    ) || null
  );
};

export const selectCurrentChatId = (state, chatId) =>
  selectChatState(state, chatId).currentChatId || null;

// Computed selectors
export const selectSheetStats = (state, chatId) => {
  const sheetData = selectSheetData(state, chatId);

  if (!sheetData || !Array.isArray(sheetData)) {
    return { rowCount: 0, columnCount: 0, hasData: false };
  }

  const rowCount = sheetData.length;
  let columnCount = 0;

  if (rowCount > 0) {
    const allColumns = new Set();
    sheetData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "id") {
          allColumns.add(key);
        }
      });
    });
    columnCount = allColumns.size;
  }

  return {
    rowCount,
    columnCount,
    hasData: rowCount > 0 && columnCount > 0,
  };
};

export const selectIsSheetLoading = (state, chatId) => {
  const status = selectSheetStatus(state, chatId);
  return status === "generating";
};

export const selectSheetError = (state, chatId) => {
  const status = selectSheetStatus(state, chatId);
  return status === "error";
};

export default sheetSlice.reducer;
