import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuerySlide = fetchBaseQuery({
  mode: "cors",
  baseUrl: process.env.NEXT_PUBLIC_API_URL + "/slide",
  prepareHeaders: async (headers, { getState, endpoint }) => {
    const token =
      getState()?.auth?.accessToken || localStorage.getItem("accessToken");

    const endpointsThatUploadFiles = ["uploadPresentationFiles", "uploadImage"];

    // if (!endpointsThatUploadFiles.includes(endpoint)) {
    //   headers.set("Content-Type", "application/json");
    // }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const presentationApiSlice = createApi({
  reducerPath: "presentationApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuerySlide(args, api, extraOptions);
    // 
    return result;
  },
  tagTypes: ["presentation", "logs", "slides"],
  endpoints: (builder) => ({
    // Create presentation
    createPresentation: builder.mutation({
      query: (message) => ({
        url: "/presentation/init",
        method: "POST",
        body: message,
      }),
      invalidatesTags: ["presentation"],
    }),

    // Fetch logs
    fetchLogs: builder.query({
      query: (presentationId) => `/presentation/logs/${presentationId}`,
      providesTags: (result, error, presentationId) => [
        { type: "logs", id: presentationId },
      ],
    }),

    // Fetch slides
    fetchSlides: builder.query({
      query: (presentationId) => `/slides?p_id=${presentationId}`,
      providesTags: (result, error, presentationId) => [
        { type: "slides", id: presentationId },
      ],
    }),

    // Fetch all presentations
    fetchAllPresentations: builder.query({
      query: () => ({
        url: "/presentations",
        method: "GET",
      }),
      providesTags: ["presentation"],
    }),

    // Upload file for Presentation
    uploadPresentationFiles: builder.mutation({
      query: ({ files, userId }) => {
        const formData = new FormData();

        // Ensure files is an array and append each file
        const fileArray = Array.isArray(files) ? files : [files];
        fileArray.forEach((file) => {
          formData.append("files", file);
        });

        // Add userId if provided
        if (userId) {
          formData.append("user_id", userId);
        }


        return {
          url: "/upload-file",
          method: "POST",
          body: formData,
          // Don't set Content-Type header - let browser set it with boundary
          // formData: true,
        };
      },
      // Enhanced error handling
      transformErrorResponse: (response, meta, arg) => {
        // console.error("Upload error response:", response);
        // console.error("Upload error meta:", meta);
        return {
          status: response.status,
          data: response.data || "Upload failed",
          originalError: response,
        };
      },
    }),

    // Save slide edits
    saveSlide: builder.mutation({
      query: ({ slideId, presentationId, htmlContent, metadata }) => ({
        url: `/slides/${slideId}/save`,
        method: "PATCH",
        body: {
          presentation_id: presentationId,
          html_content: htmlContent,
          metadata: metadata || {},
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "slides", id: arg.presentationId },
      ],
    }),
  }),
});

export const {
  useCreatePresentationMutation,
  useFetchLogsQuery,
  useFetchSlidesQuery,
  useFetchAllPresentationsQuery,
  useUploadPresentationFilesMutation,
  useSaveSlideMutation,
} = presentationApiSlice;
