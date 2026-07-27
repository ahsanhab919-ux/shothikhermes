import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const shareAiDetectorApiSlice = createApi({
  reducerPath: "shareAiDetectorApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    return result;
  },
  tagTypes: ["ShareAiDetector", "AiDetectorAnalytics"],
  endpoints: (builder) => ({
    // Create private share (via email)
    createPrivateShare: builder.mutation({
      query: ({ historyId, emails, message, settings }) => ({
        url: `/share-ai-detector/private`,
        method: "POST",
        body: { historyId, emails, message, settings },
      }),
      invalidatesTags: ["ShareAiDetector", "AiDetectorAnalytics"],
    }),

    // Create public share link
    createPublicShare: builder.mutation({
      query: ({ historyId, message, settings }) => ({
        url: `/share-ai-detector/public`,
        method: "POST",
        body: { historyId, message, settings },
      }),
      invalidatesTags: ["ShareAiDetector", "AiDetectorAnalytics"],
    }),

    // Verify and access shared AI Detector content
    verifySharedAiDetector: builder.query({
      query: ({ shareLinkId, password }) => ({
        url: `/share-ai-detector/verify/${shareLinkId}`,
        method: "GET",
        params: password ? { password } : {},
      }),
      providesTags: (result, error, { shareLinkId }) => [
        { type: "ShareAiDetector", id: shareLinkId },
      ],
    }),

    // Get share analytics for a share
    getShareAnalytics: builder.query({
      query: (shareId) => `/share-ai-detector/analytics/${shareId}`,
      providesTags: (result, error, shareId) => [
        { type: "AiDetectorAnalytics", id: shareId },
      ],
    }),

    // Update share settings
    updateShareSettings: builder.mutation({
      query: ({ shareId, settings }) => ({
        url: `/share-ai-detector/${shareId}/settings`,
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["ShareAiDetector"],
    }),

    // Deactivate a share
    deactivateShare: builder.mutation({
      query: (shareId) => ({
        url: `/share-ai-detector/${shareId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ShareAiDetector", "AiDetectorAnalytics"],
    }),
  }),
});

export const {
  useCreatePrivateShareMutation,
  useCreatePublicShareMutation,
  useVerifySharedAiDetectorQuery,
  useLazyVerifySharedAiDetectorQuery,
  useGetShareAnalyticsQuery,
  useUpdateShareSettingsMutation,
  useDeactivateShareMutation,
} = shareAiDetectorApiSlice;

