import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const humanizeHistoryApiSlice = createApi({
  reducerPath: "humanizeHistory",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    return result;
  },
  tagTypes: ["humanizeHistory"],
  endpoints: (builder) => ({
    // fetch all history
    getAllHistory: builder.query({
      query: () => ({
        url: "/gpt-history",
        providesTags: ["humanizeHistory"],
      }),
    }),

    // fetch one history
    getSingleHistory: builder.query({
      query: ({ id }) => ({
        url: `/gpt-history/${id}`,
        providesTags: ["humanizeHistory"],
      }),
    }),

    deleteSingleHistory: builder.mutation({
      query: ({ id }) => ({
        url: `/gpt-history/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["humanizeHistory"],
    }),

    getHistoryStats: builder.query({
      query: () => ({
        url: "/gpt-stats",
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetAllHistoryQuery,
  useGetSingleHistoryQuery,
  useDeleteSingleHistoryMutation,
  useGetHistoryStatsQuery,
} = humanizeHistoryApiSlice;
