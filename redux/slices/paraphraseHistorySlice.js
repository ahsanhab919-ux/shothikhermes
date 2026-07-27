import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  historiesMeta: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  histories: [],
  historyGroups: [],
  activeHistory: {},
  activeHistoryIndex: -1,
  isUpdateHistory: false,
  isHistoryLoading: false,

  // paraphrase file histories
  fileHistoriesMeta: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  fileHistories: [],
  fileHistoryGroups: [],
  isUpdatedFileHistory: false,
  isFileHistoryLoading: false,
};

const paraphraseHistorySlice = createSlice({
  name: "paraphraseHistory",
  initialState,
  reducers: {
    // paraphrase histories
    setHistoriesMeta: (state, action) => {
      state.historiesMeta = action.payload || {};
    },
    updateHistoriesMeta: (state, action) => {
      const { field, value } = action.payload;
      if (state.historiesMeta?.[field]) {
        state.historiesMeta[field] = value || 0;
      }
    },
    setHistories: (state, action) => {
      state.histories = action.payload || [];
      if (state.activeHistory?._id && action?.payload?.length > 0) {
        state.activeHistoryIndex = action?.payload.findIndex(
          (history) => history?._id === state.activeHistory?._id,
        );
      } else {
        state.activeHistoryIndex = -1;
      }
    },
    setHistoryGroups: (state, action) => {
      state.historyGroups = action.payload || [];
    },
    setActiveHistory: (state, action) => {
      state.activeHistory = action.payload;
      if (action?.payload?._id && state?.histories?.length > 0) {
        state.activeHistoryIndex = state.histories.findIndex(
          (history) => history?._id === action.payload?._id,
        );
      } else {
        state.activeHistoryIndex = -1;
      }
    },
    toggleUpdateHistory: (state) => {
      state.isUpdateHistory = !state.isUpdateHistory;
    },
    setIsHistoryLoading: (state, action) => {
      state.isHistoryLoading = action.payload;
    },

    // paraphrase file histories
    setFileHistoriesMeta: (state, action) => {
      state.fileHistoriesMeta = action.payload || {};
    },
    updateFileHistoriesMeta: (state, action) => {
      const { field, value } = action.payload;
      if (state.fileHistoriesMeta?.[field]) {
        state.fileHistoriesMeta[field] = value || 0;
      }
    },
    setFileHistories: (state, action) => {
      state.fileHistories = action.payload || [];
    },
    setFileHistoryGroups: (state, action) => {
      state.fileHistoryGroups = action.payload || [];
    },
    toggleUpdateFileHistory: (state) => {
      state.isUpdatedFileHistory = !state.isUpdatedFileHistory;
    },
    setIsFileHistoryLoading: (state, action) => {
      state.isFileHistoryLoading = action.payload;
    },
  },
});

export const {
  setActiveHistory,
  setHistoriesMeta,
  updateHistoriesMeta,
  setHistories,
  setHistoryGroups,
  toggleUpdateHistory,
  setIsHistoryLoading,

  // paraphrase file histories
  setFileHistoriesMeta,
  updateFileHistoriesMeta,
  setFileHistories,
  setFileHistoryGroups,
  toggleUpdateFileHistory,
  setIsFileHistoryLoading,
} = paraphraseHistorySlice.actions;
export default paraphraseHistorySlice.reducer;
