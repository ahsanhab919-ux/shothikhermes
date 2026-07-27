import { getUser, loggedIn, logout, setUserLimit } from "@/redux/slices/auth";
import { identifyUser, trackLogin, trackSignup, resetUser } from "@/lib/posthog";
import { authApiSlice } from "./authApiSlice";

export const authApi = authApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUser: builder.query({
      query: () => {
        return {
          url: `/user/profile`,
          method: "GET",
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data?.email) {
            dispatch(getUser(result?.data));
            dispatch(authApi.util.invalidateTags(["user-limit"]));
            if (result.data._id || result.data.id) {
              identifyUser(result.data._id || result.data.id);
            }
          }
        } catch (err) {
          // do nothing
        }
      },
      providesTags: ["User"],
    }),

    getUserLimit: builder.query({
      query: () => {
        return {
          url: `/user-limit`,
          method: "GET",
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data) {
            dispatch(setUserLimit(result?.data));
          }
        } catch (err) {
          // Query failed - user limit will use defaults
        }
      },
      providesTags: ["user-limit"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: `/user/profile-update`,
        method: "POST",
        body: data,
      }),
    }),
    getTransectionHistory: builder.query({
      query: () => ({
        url: `/payment/transection-history`,
        method: "GET",
      }),
    }),
    getToken: builder.query({
      query: () => {
        return {
          url: `/auth/token-generate`,
          method: "GET",
        };
      },
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data) {
            dispatch(loggedIn(result?.data?.token));
          }
        } catch (err) {
        }
      },
    }),
    login: builder.mutation({
      query: (data) => ({
        url: `/auth/login`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data?.token) {
            dispatch(loggedIn(result?.data?.token));
            dispatch(authApi.util.invalidateTags(["User"]));
            trackLogin();
          }
        } catch (err) {
          // do nothing
        }
      },
    }),
    register: builder.mutation({
      query: (data) => ({
        url: `/auth/register`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data?.token) {
            dispatch(loggedIn(result?.data?.token));
            dispatch(authApi.util.invalidateTags(["User"]));
            trackSignup();
          }
        } catch (err) {
          // do nothing
        }
      },
    }),
    googleLogin: builder.mutation({
      query: (data) => ({
        url: `/auth/google-login`,
        method: "POST",
        body: data,
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data?.token) {
            dispatch(loggedIn(result?.data?.token));
            dispatch(authApi.util.invalidateTags(["User"]));
            trackLogin();
          }
        } catch (err) {
          // do nothing
        }
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: `/auth/logout`,
        method: "POST",
      }),
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          if (result?.data?.status === "success") {
            resetUser();
            dispatch(logout());
          }
        } catch (err) {
          // do nothing
        }
      },
    }),
    forgotPassword: builder.mutation({
      query: (data) => {
        return {
          url: `/auth/forgot-password`,
          method: "POST",
          body: data,
        };
      },
    }),
    changePassword: builder.mutation({
      query: (data) => {
        return {
          url: `/auth/change-password`,
          method: "PUT",
          body: data,
        };
      },
    }),
    resetPassword: builder.mutation({
      query: ({ key, email, password }) => {
        return {
          url: `/auth/reset-password/${key}`,
          method: "POST",
          body: { email, password },
        };
      },
    }),
    sendVerifyEmail: builder.mutation({
      query: (data) => {
        return {
          url: `/auth/send-verify-email`,
          method: "POST",
          body: data,
        };
      },
    }),
    verifyEmail: builder.mutation({
      query: ({ key }) => {
        return {
          url: `/auth/verify-email/${key}`,
          method: "POST",
        };
      },
    }),
    uploadImage: builder.mutation({
      query: (data) => {
        return {
          url: "/user/upload",
          method: "POST",
          body: data,
        };
      },
    }),
    contact: builder.mutation({
      query: (data) => {
        return {
          url: "/contact",
          method: "POST",
          body: data,
        };
      },
    }),
    affiliate: builder.mutation({
      query: (data) => {
        return {
          url: "/user/affiliate",
          method: "POST",
          body: data,
        };
      },
    }),

    registerUserToBetaList: builder.mutation({
      query: (email) => {
        return {
          url: "/user/register-to-betalist",
          method: "POST",
          body: email,
        };
      },
    }),
  }),
});

export const {
  useGetTransectionHistoryQuery,
  useGetUserQuery,
  useGetUserLimitQuery,
  useRegisterMutation,
  useLoginMutation,
  useGoogleLoginMutation,
  useUpdateProfileMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useSendVerifyEmailMutation,
  useVerifyEmailMutation,
  useGetTokenQuery,
  useUploadImageMutation,
  useContactMutation,
  useAffiliateMutation,
  useRegisterUserToBetaListMutation,
} = authApi;
