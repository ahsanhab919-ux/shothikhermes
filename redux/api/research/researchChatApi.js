import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const researchChatApi = createApi({
  reducerPath: "researchChatApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL +
      `/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("accessToken");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Research-Chat"],
  endpoints: (builder) => ({
    createChat: builder.mutation({
      query: (name) => ({
        url: "/chat/create_chat",
        method: "POST",
        body: { name },
      }),
      invalidatesTags: ["Research-Chat"],
    }),
    getMyResearchChats: builder.query({
      query: () => "/chat/get_my_chats",
      providesTags: ["Research-Chat"],
    }),
    getOneChat: builder.query({
      query: (id) => `/chat/get_one_chat/${id}`,
      providesTags: (result, error, id) => [{ type: "Chat", id }],
    }),
    updateChatName: builder.mutation({
      query: ({ id, name }) => ({
        url: `/chat/update_name/${id}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Chat", id }],
    }),
    deleteChat: builder.mutation({
      query: (id) => ({
        url: `/chat/delete_chat/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Research-Chat"],
    }),

    // Upload files for Research
    uploadResearchFiles: builder.mutation({
      query: ({ files, userId }) => {
        const formData = new FormData();
        const fileArray = Array.isArray(files) ? files : [files];
        fileArray.forEach((file) => {
          formData.append("files", file);
        });
        if (userId) {
          formData.append("user_id", userId);
        }
        return {
          url: "/upload-file",
          method: "POST",
          body: formData,
        };
      },
      transformErrorResponse: (response) => {
        return {
          status: response.status,
          data: response.data || "Upload failed",
          originalError: response,
        };
      },
    }),
  }),
});

export const {
  useCreateChatMutation,
  useGetMyResearchChatsQuery,
  useGetOneChatQuery,
  useUpdateChatNameMutation,
  useDeleteChatMutation,
  useUploadResearchFilesMutation,
} = researchChatApi;
