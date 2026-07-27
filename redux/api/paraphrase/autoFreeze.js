import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const autoFreezeApiSlice = createApi({
  reducerPath: "autoFreezeApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    if (!result) {
      console.error("Unexpected API response:", result);
      return {
        error: { status: "CUSTOM_ERROR", message: "Invalid API response" },
      };
    }
    return result;
  },
  tagTypes: ["autoFreeze"],
  endpoints: (builder) => ({
    detectAutoFreezeTerms: builder.mutation({
      query: ({ text, language, useLLM = true }) => {
        return {
          url: "/auto-freeze/detect",
          method: "POST",
          body: {
            text,
            language,
            useLLM,
          },
        };
      },
    }),
    disableAutoFreezeTerm: builder.mutation({
      query: (payload) => {
        return {
          url: "/auto-freeze/disable",
          method: "POST",
          body: payload,
        };
      },
    }),
    enableAutoFreezeTerm: builder.mutation({
      query: (payload) => {
        return {
          url: "/auto-freeze/enable",
          method: "POST",
          body: payload,
        };
      },
    }),
    getDisabledTerms: builder.query({
      query: (payload) => {
        return {
          url: "/auto-freeze/enable",
          method: "GET",
          body: payload,
        };
      },
    }),
  }),
});

export const {
  useDetectAutoFreezeTermsMutation,
  useDisableAutoFreezeTermsMutation,
  useEnableAutoFreezeTermMutation,
  useGetDisabledTermsQuery,
} = autoFreezeApiSlice;
