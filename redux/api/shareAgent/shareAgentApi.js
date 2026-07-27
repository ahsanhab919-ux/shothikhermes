import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const shareAgentApiSlice = createApi({
  reducerPath: "shareAgentApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    return result;
  },
  tagTypes: ["ShareAgent", "AgentAnalytics"],
  endpoints: (builder) => ({
    // Create private share (via email)
    createPrivateShare: builder.mutation({
      query: ({ agentId, emails, message, settings, content }) => ({
        url: `/share-agent/private`,
        method: "POST",
        body: { agentId, emails, message, settings, content },
      }),
      invalidatesTags: ["ShareAgent", "AgentAnalytics"],
    }),

    // Create public share link
    createPublicShare: builder.mutation({
      query: ({ agentId, message, settings, content }) => ({
        url: `/share-agent/public`,
        method: "POST",
        body: { agentId, message, settings, content },
      }),
      invalidatesTags: ["ShareAgent", "AgentAnalytics"],
    }),

    // Verify and access shared agent
    verifySharedAgent: builder.query({
      query: ({ shareId, password }) => ({
        url: `/share-agent/verify/${shareId}`,
        method: "GET",
        params: password ? { password } : {},
      }),
      providesTags: (result, error, { shareId }) => [
        { type: "ShareAgent", id: shareId },
      ],
    }),

    // Get share analytics for an agent
    getAgentShareAnalytics: builder.query({
      query: (agentId) => `/share-agent/analytics/${agentId}`,
      providesTags: (result, error, agentId) => [
        { type: "AgentAnalytics", id: agentId },
      ],
    }),

    // Deactivate a share
    deactivateShare: builder.mutation({
      query: (shareId) => ({
        url: `/share-agent/${shareId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ShareAgent", "AgentAnalytics"],
    }),

    // Create replica/copy of shared agent
    createAgentReplica: builder.mutation({
      query: ({ sharedAgentId, currentUserId, source, metadata }) => ({
        url: `/share-agent/replica`,
        method: "POST",
        body: { sharedAgentId, currentUserId, source, metadata },
      }),
      invalidatesTags: ["ShareAgent"],
    }),
  }),
});

export const {
  useCreatePrivateShareMutation,
  useCreatePublicShareMutation,
  useVerifySharedAgentQuery,
  useLazyVerifySharedAgentQuery,
  useGetAgentShareAnalyticsQuery,
  useDeactivateShareMutation,
  useCreateAgentReplicaMutation,
} = shareAgentApiSlice;

