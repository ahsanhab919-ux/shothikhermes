import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const customModesApi = createApi({
  reducerPath: "customModesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX}/api/modes`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["CustomModes"],
  endpoints: (builder) => ({
    // Get custom modes
    getCustomModes: builder.query({
      query: () => "/custom-modes",
      providesTags: ["CustomModes"],
      transformResponse: (response) => ({
        customModes: response.customModes || [],
        recentModes: response.recentModes || [],
      }),
    }),

    // Create/Save custom modes
    saveCustomModes: builder.mutation({
      query: (data) => ({
        url: "/custom-modes",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CustomModes"],
    }),

    // Update custom mode
    updateCustomMode: builder.mutation({
      query: ({ modeId, name }) => ({
        url: `/custom-modes/${modeId}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["CustomModes"],
      // Optimistic update
      async onQueryStarted({ modeId, name }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          customModesApi.util.updateQueryData(
            "getCustomModes",
            undefined,
            (draft) => {
              const mode = draft.customModes.find(
                (m) => m._id === modeId || m.id === modeId,
              );
              if (mode) {
                mode.name = name;
                mode.updatedAt = new Date().toISOString();
              }
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Delete custom mode
    deleteCustomMode: builder.mutation({
      query: (modeId) => ({
        url: `/custom-modes/${modeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CustomModes"],
      // Optimistic update
      async onQueryStarted(modeId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          customModesApi.util.updateQueryData(
            "getCustomModes",
            undefined,
            (draft) => {
              draft.customModes = draft.customModes.filter(
                (m) => m._id !== modeId && m.id !== modeId,
              );
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Track mode usage (lightweight endpoint)
    trackModeUsage: builder.mutation({
      query: (modeName) => ({
        url: "/custom-modes/track-usage",
        method: "POST",
        body: { modeName },
      }),
      // Optimistically update recent modes
      async onQueryStarted(modeName, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          customModesApi.util.updateQueryData(
            "getCustomModes",
            undefined,
            (draft) => {
              const MAX_RECENT = 5;
              draft.recentModes = [
                modeName,
                ...draft.recentModes.filter((m) => m !== modeName),
              ].slice(0, MAX_RECENT);
            },
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetCustomModesQuery,
  useSaveCustomModesMutation,
  useUpdateCustomModeMutation,
  useDeleteCustomModeMutation,
  useTrackModeUsageMutation, // ADD THIS
} = customModesApi;
