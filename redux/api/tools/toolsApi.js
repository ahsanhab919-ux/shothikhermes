import { createApi } from "@reduxjs/toolkit/query/react";
import { ENV } from "@/config/env";
import { baseQuery } from "../config";

export const toolsApiSlice = createApi({
  reducerPath: "toolsApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    return result;
  },
  tagTypes: ["tools"],
  endpoints: (builder) => ({
    spellChecker: builder.mutation({
      query: (payload) => {
        return {
          url: "/grammar/check",
          method: "POST",
          body: payload,
        };
      },
    }),
    paraphraseForTagging: builder.mutation({
      query: (payload) => ({
        url: `${ENV.api_url}/${process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX || "paraphrase"}/api/paraphrase-for-tagging`,
        // url: `${process.env.NEXT_PUBLIC_PARAPHRASE_API_URL}/api/paraphrase-for-tagging`,
        method: "POST",
        body: payload,
      }),
    }),
    reportForSentence: builder.mutation({
      query: (payload) => {
        return {
          url: "/report/send-report",
          method: "POST",
          body: payload,
        };
      },
    }),
    paraphrased: builder.mutation({
      query: (payload) => ({
        url: `${ENV.api_url}/${process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX || "paraphrase"}/api/paraphraseV2`,
        // url: `${process.env.NEXT_PUBLIC_PARAPHRASE_API_URL}/api/paraphraseV2`,
        method: "POST",
        body: payload,
      }),
    }),
    getUsesLimit: builder.query({
      query: (payload) => {
        return {
          url: "/uses-limit",
          method: "POST",
          body: payload,
        };
      },
    }),
    humanizeContend: builder.mutation({
      query: (payload) => {
        return {
          // url: "/humanizerV4",
          url: "/humanizerV5",
          method: "POST",
          body: payload,
        };
      },
    }),
    scanAidetector: builder.mutation({
      query: (payload) => {
        return {
          url: "/ai-detector/check",
          method: "POST",
          body: payload,
        };
      },
    }),
    getShareAidetectorContend: builder.query({
      query: (id) => {
        return {
          url: `/ai-detector/share/${id}`,
          method: "GET",
        };
      },
    }),
    saveSharedAiDetectorHistory: builder.mutation({
      query: (payload) => {
        return {
          url: "/ai-detector/save-shared",
          method: "POST",
          body: payload,
        };
      },
    }),
    researchTrending: builder.query({
      query: () => {
        return {
          url: "/research/trending-queries",
          method: "GET",
        };
      },
    }),
    getResearchQuestion: builder.mutation({
      query: (payload) => {
        return {
          url: "/research/questions",
          method: "POST",
          body: payload,
        };
      },
    }),
    getResearchMetaData: builder.query({
      query: (payload) => ({
        url: "/research/meta",
        method: "POST",
        body: payload,
      }),
      keepUnusedDataFor: 24 * 60 * 60,
      refetchOnMountOrArgChange: false,
    }),
    getAgentSession: builder.query({
      query: (payload) => ({
        url: "/agent/session",
        method: "POST",
        body: payload,
      }),
    }),
    getAgentSessionById: builder.query({
      query: (session_id) => ({
        url: `/agent/session/${session_id}`,
      }),
    }),
  }),
});

export const {
  useSpellCheckerMutation,
  useParaphraseForTaggingMutation,
  useReportForSentenceMutation,
  useParaphrasedMutation,
  useGetUsesLimitQuery,
  useHumanizeContendMutation,
  useScanAidetectorMutation,
  useGetShareAidetectorContendQuery,
  useSaveSharedAiDetectorHistoryMutation,
  useResearchTrendingQuery,
  useGetResearchQuestionMutation,
  useGetResearchMetaDataQuery,
  useGetAgentSessionQuery,
  useGetAgentSessionByIdQuery,
} = toolsApiSlice;
