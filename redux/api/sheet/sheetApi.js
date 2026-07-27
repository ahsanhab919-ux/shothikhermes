// sheetApiSlice.js - Updated to use new Sheet Service Backend (Port 3003)
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SHEET_SERVICE_URL = process.env.NEXT_PUBLIC_SHEET_SERVICE_URL || 'http://localhost:3003';

export const sheetApiSlice = createApi({
  reducerPath: "sheetApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SHEET_SERVICE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["SheetJob", "MySheets"],
  endpoints: (builder) => ({
    // Create new sheet generation job
    createSheet: builder.mutation({
      query: (body) => ({
        url: '/sheets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ["SheetJob"],
    }),

    // Get sheet job status
    getSheetJob: builder.query({
      query: (jobId) => `/sheets/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: "SheetJob", id: jobId }],
    }),

    getMySheets: builder.query({
      query: (userId) => `/sheets?userId=${encodeURIComponent(userId)}`,
      providesTags: ["MySheets"],
    }),

    // Export sheet
    exportSheet: builder.query({
      query: ({ jobId, format }) => `/sheets/${jobId}/export/${format}`,
    }),

    // Upload sheet files
    uploadSheetFiles: builder.mutation({
      query: (formData) => ({
        url: '/sheets/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ["MySheets"],
    }),

    // Get chat session history from Next.js / MongoDB
    getChatHistory: builder.query({
      queryFn: async (chatId) => {
        try {
          if (!chatId) return { data: null };
          const res = await fetch(`/api/sheet/session/${chatId}/history`);
          if (!res.ok) return { data: null };
          const data = await res.json();
          return { data };
        } catch {
          return { data: null };
        }
      },
    }),
  }),
});

export const {
  useCreateSheetMutation,
  useGetSheetJobQuery,
  useGetMySheetsQuery,
  useExportSheetQuery,
  useUploadSheetFilesMutation,
  useGetChatHistoryQuery,
} = sheetApiSlice;

export default sheetApiSlice;
