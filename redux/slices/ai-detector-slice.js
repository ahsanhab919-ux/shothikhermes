import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Text & Language
  text: "",
  language: "English (US)",

  // Sections
  sections: [],
  sectionsGroups: [],
  sectionsMeta: {},
  selectedSection: {},
  isSectionLoading: false,
  isSectionbarOpen: false,
  isUpdatedSections: false,

  // Issues & Recommendations
  score: 0,
  scores: [],

  issues: [],
  selectedIssue: {},

  recommendations: [],
  selectedRecommendation: {},

  // UI State
  tabs: ["all", "grammar", "recommendation"],
  selectedTab: "all",
  isSidebarOpen: false,

  // Loading
  isCheckLoading: false,
  isRecommendationLoading: false,
};

const grammarCheckerSlice = createSlice({
  name: "grammar_checker",
  initialState,
  reducers: {
    // 🔤 Text & Language
    setText: (state, action) => {
      state.text = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },

    // 🧩 Sections
    setSections: (state, action) => {
      state.sections = action.payload || [];
    },
    setSectionsGroups: (state, action) => {
      state.sectionsGroups = action.payload || [];
    },
    setSectionsMeta: (state, action) => {
      state.sectionsMeta = action.payload || {};
    },
    updateSectionsMeta: (state, action) => {
      const { field, value } = action.payload;
      if (state.sectionsMeta?.[field]) {
        state.sectionsMeta[field] = value || 0;
      }
    },
    setSelectedSection: (state, action) => {
      state.selectedSection = action.payload;
    },
    setIsSectionLoading: (state, action) => {
      state.isSectionLoading = action.payload;
    },
    setIsSectionbarOpen: (state, action) => {
      state.isSectionbarOpen = action.payload;
    },
    setIsUpdatedSections: (state, action) => {
      state.isUpdatedSections = action.payload;
    },

    // 🧠 Issues & Recommendations
    setScore: (state, action) => {
      state.score = action.payload;
    },
    setScores: (state, action) => {
      state.scores = action.payload;
    },

    setIssues: (state, action) => {
      state.issues = action.payload;
    },
    setSelectedIssue: (state, action) => {
      state.selectedIssue = action.payload;
    },

    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
    setSelectedRecommendation: (state, action) => {
      state.selectedRecommendation = action.payload;
    },

    // ⚙️ UI State
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    setIsSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },

    // 🚀 Loading
    setIsCheckLoading: (state, action) => {
      state.isCheckLoading = action.payload;
    },
    setIsRecommendationLoading: (state, action) => {
      state.isRecommendationLoading = action.payload;
    },
  },
});

export const {
  // 🔤 Text & Language
  setText,
  setLanguage,

  // 🧩 Sections
  setSections,
  setSectionsGroups,
  setSectionsMeta,
  updateSectionsMeta,
  setSelectedSection,
  setIsSectionLoading,
  setIsSectionbarOpen,
  setIsUpdatedSections,

  // 🧠 Issues & Recommendations
  setScore,
  setScores,

  setIssues,
  setSelectedIssue,

  setRecommendations,
  setSelectedRecommendation,

  // ⚙️ UI State
  setSelectedTab,
  setIsSidebarOpen,

  // 🚀 Loading
  setIsCheckLoading,
} = grammarCheckerSlice.actions;

export default grammarCheckerSlice.reducer;
