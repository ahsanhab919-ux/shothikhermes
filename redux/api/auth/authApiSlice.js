import { logout } from "@/redux/slices/auth";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../config";

export const authApiSlice = createApi({
  reducerPath: "authApi",
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    if (result?.error?.status === 401) {
      api.dispatch(logout());
      if (typeof window !== "undefined") {
        ["accessToken", "sheetai-token", "research-token"].forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error(`Failed to remove ${key} from localStorage`, error);
          }
        });
      }
    }
    return result;
  },
  tagTypes: ["user-limit", "User"],
  endpoints: (builder) => ({}),
});
