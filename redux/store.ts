// store.ts
import type { Reducer } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

// --- API slices ---
import { authApiSlice } from "./api/auth/authApiSlice";
import { blogApiSlice } from "./api/blog/blogApiSlice";
import { humanizeHistoryApiSlice } from "./api/humanizeHistory/humanizeHistory";
import { autoFreezeApiSlice } from "./api/paraphrase/autoFreeze";
import { customModesApi } from "./api/paraphrase/customModesApi";
import { presentationApiSlice } from "./api/presentation/presentationApi";
import { pricingApiSlice } from "./api/pricing/pricingApi";
import { researchChatApi } from "./api/research/researchChatApi";
import { researchCoreApi } from "./api/research/researchCoreApi";
import { shareApiSlice } from "./api/share/shareApi";
import { shareAgentApiSlice } from "./api/shareAgent/shareAgentApi";
import { shareAiDetectorApiSlice } from "./api/shareAiDetector/shareAiDetectorApi";
import { sheetApiSlice } from "./api/sheet/sheetApi";
import { toolsApiSlice } from "./api/tools/toolsApi";

// --- JS slices (no types available) ---
import aiDetectorReducer from "./slices/ai-detector-slice";
import auth from "./slices/auth";
import grammarCheckerReducer from "./slices/grammar-checker-slice";
import inputOutput from "./slices/inputOutput";
import paraphraseHistoryReducer from "./slices/paraphraseHistorySlice";
import presentationSlice from "./slices/presentationSlice";
import researchChatReducer from "./slices/researchChatSlice";
import researchCoreReducer from "./slices/researchCoreSlice";
import researchUiSlice from "./slices/researchUiSlice";
import settings from "./slices/settings-slice";
import sheetSlice from "./slices/sheetSlice";
import slideEditReducer from "./slices/slideEditSlice";
import tools from "./slices/tools";
import uploadQueueReducer from "./slices/uploadQueueSlice";
import userWalletReducer from "./slices/user-wallet-slice";
import featureEndpointsReducer from "./slices/feature-endpoints-slice";
import featuresWithCredentialsReducer from "./slices/features-with-credentials-slice";
import analyticsReducer from "./slices/analyticsSlice";

export const store = configureStore({
  reducer: {
    auth: auth as Reducer,
    inputOutput: inputOutput as Reducer,
    settings: settings as Reducer,
    tools: tools as Reducer,
    presentation: presentationSlice as Reducer,
    slideEdit: slideEditReducer as Reducer,
    sheet: sheetSlice as Reducer,
    researchChat: researchChatReducer as Reducer,
    researchCore: researchCoreReducer as Reducer,
    researchUi: researchUiSlice as Reducer,
    paraphraseHistory: paraphraseHistoryReducer as Reducer,
    grammar_checker: grammarCheckerReducer as Reducer,
    ai_detector: aiDetectorReducer as Reducer,
    uploadQueue: uploadQueueReducer as Reducer,
    user_wallet: userWalletReducer as Reducer,
    feature_endpoints: featureEndpointsReducer as Reducer,
    features_with_credentials: featuresWithCredentialsReducer as Reducer,
    analytics: analyticsReducer as Reducer,

    // API reducers
    [shareApiSlice.reducerPath]: shareApiSlice.reducer,
    [shareAgentApiSlice.reducerPath]: shareAgentApiSlice.reducer,
    [shareAiDetectorApiSlice.reducerPath]: shareAiDetectorApiSlice.reducer,
    [authApiSlice.reducerPath]: authApiSlice.reducer,
    [blogApiSlice.reducerPath]: blogApiSlice.reducer,
    [pricingApiSlice.reducerPath]: pricingApiSlice.reducer,
    [toolsApiSlice.reducerPath]: toolsApiSlice.reducer,
    [presentationApiSlice.reducerPath]: presentationApiSlice.reducer,
    [humanizeHistoryApiSlice.reducerPath]: humanizeHistoryApiSlice.reducer,
    [sheetApiSlice.reducerPath]: sheetApiSlice.reducer,
    [researchChatApi.reducerPath]: researchChatApi.reducer,
    [researchCoreApi.reducerPath]: researchCoreApi.reducer,
    [autoFreezeApiSlice.reducerPath]: autoFreezeApiSlice.reducer,
    [customModesApi.reducerPath]: customModesApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApiSlice.middleware,
      blogApiSlice.middleware,
      pricingApiSlice.middleware,
      toolsApiSlice.middleware,
      presentationApiSlice.middleware,
      humanizeHistoryApiSlice.middleware,
      shareApiSlice.middleware,
      shareAgentApiSlice.middleware,
      shareAiDetectorApiSlice.middleware,
      sheetApiSlice.middleware,
      researchChatApi.middleware,
      researchCoreApi.middleware,
      autoFreezeApiSlice.middleware,
      customModesApi.middleware,
    ),

  devTools: process.env.NODE_ENV !== "production",
});

// --- Infer types from the store ---
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
