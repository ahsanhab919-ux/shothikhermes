import { createSlice } from "@reduxjs/toolkit";

const LOCAL_STORAGE_KEY = "settings";

const defaultSetting = {
  theme: "system",
  direction: "ltr",
  sidebar: "expanded",
  header: "expanded",
  layout: "vertical",

  // features settings
  demo: false,
  paraphraseOptions: {
    paraphraseQuotations: true,
    avoidContractions: true,
    preferActiveVoice: false,
    automaticStartParaphrasing: false,
    autoFreeze: false,
  },
  interfaceOptions: {
    useYellowHighlight: false,
    showTooltips: true,
    showChangedWords: true,
    showStructuralChanges: false,
    showLongestUnchangedWords: false,
  },
  humanizeOptions: {
    humanizeQuotations: true,
    avoidContractions: false,
    automaticStartHumanize: false,
  },
};

const initialState = { ...defaultSetting, _hydrated: false };

const saveState = (state) => {
  const { _hydrated, ...rest } = state;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rest));
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    hydrateSettings(state) {
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            Object.assign(state, saved);
          }
        } catch (e) {}
      }
      state._hydrated = true;
    },
    updateTheme(state, action) {
      state.theme = action.payload;
      saveState(state);
    },
    toggleTheme(state) {
      const order = ["light", "dark", "system"];
      const nextIndex = (order.indexOf(state.theme) + 1) % order.length;
      state.theme = order[nextIndex];
      saveState(state);
    },

    updateSidebar(state, action) {
      state.sidebar = action.payload;
      saveState(state);
    },
    toggleSidebar(state) {
      state.sidebar = state.sidebar === "expanded" ? "compact" : "expanded";
      saveState(state);
    },

    updateHeader(state, action) {
      state.header = action.payload;
      saveState(state);
    },
    toggleHeader(state) {
      state.header = state.header === "expanded" ? "compact" : "expanded";
      saveState(state);
    },

    updateLayout(state, action) {
      state.layout = action.payload;
      saveState(state);
    },
    toggleLayout(state) {
      state.layout = state.layout === "vertical" ? "horizontal" : "vertical";
      saveState(state);
    },

    setDemo(state, action) {
      state.demo = action.payload;
      saveState(state);
    },
    toggleDemo(state) {
      state.demo = !state.demo;
      saveState(state);
    },

    // features
    toggleParaphraseOption(state, action) {
      const key = action.payload;
      if (state.paraphraseOptions.hasOwnProperty(key)) {
        state.paraphraseOptions[key] = !state.paraphraseOptions[key];
        saveState(state);
      }
    },
    toggleHumanizeOption(state, action) {
      const key = action.payload;
      if (state.humanizeOptions.hasOwnProperty(key)) {
        state.humanizeOptions[key] = !state.humanizeOptions[key];
        saveState(state);
      }
    },
    toggleInterfaceOption(state, action) {
      const key = action.payload;
      if (state.interfaceOptions.hasOwnProperty(key)) {
        state.interfaceOptions[key] = !state.interfaceOptions[key];
        saveState(state);
      }
    },
  },
});

export const {
  hydrateSettings,
  updateTheme,
  toggleTheme,
  updateHeader,
  toggleHeader,
  updateLayout,
  toggleLayout,
  updateSidebar,
  toggleSidebar,
  setDemo,
  toggleDemo,
  toggleParaphraseOption,
  toggleInterfaceOption,
  toggleHumanizeOption,
} = settingsSlice.actions;

export default settingsSlice.reducer;
