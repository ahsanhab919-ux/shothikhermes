import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const shareApiSlice = createApi({
  reducerPath: "shareApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    return result;
  },
  tagTypes: ["Share", "Analytics"],
  endpoints: (builder) => ({
    // Generate share link
    generateShareLink: builder.mutation({
      query: (presentationId) => ({
        url: `/share/${presentationId}/generate`,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["Share", "Analytics"],
    }),

    // Get share analytics
    getShareAnalytics: builder.query({
      query: (presentationId) => `/share/${presentationId}/analytics`,
      providesTags: ["Analytics"],
    }),

    // Update share settings
    updateShareSettings: builder.mutation({
      query: ({ presentationId, settings }) => ({
        url: `/share/${presentationId}/settings`,
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["Share"],
    }),

    // Get existing share link
    getShareLink: builder.query({
      query: (presentationId) => `/share/${presentationId}`,
      providesTags: ["Share"],
    }),

    // Delete share link
    deleteShareLink: builder.mutation({
      query: (presentationId) => ({
        url: `/share/${presentationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Share", "Analytics"],
    }),

    // Fetch shared presentation
    fetchSharedSlides: builder.query({
      query: ({ shareLink, password, accessToken }) => {
        const params = {};
        if (password) params.password = password;
        if (accessToken) params.token = accessToken;

        return {
          url: `/share/shared/${shareLink}`,
          method: "GET",
          params,
        };
      },
      providesTags: ["Share"],
    }),

    // Track view
    trackView: builder.mutation({
      query: ({ shareId }) => ({
        url: `/share/track-view/${shareId}`,
        method: "POST",
      }),
      invalidatesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGenerateShareLinkMutation,
  useGetShareAnalyticsQuery,
  useUpdateShareSettingsMutation,
  useGetShareLinkQuery,
  useDeleteShareLinkMutation,
  useFetchSharedSlidesQuery,
  useTrackViewMutation,
} = shareApiSlice;
