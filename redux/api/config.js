import { fetchBaseQuery } from "@reduxjs/toolkit/query";

export const baseQuery = fetchBaseQuery({
  mode: "cors",
  baseUrl: `/api`,
  // baseUrl: `${process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX}`,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    const token =
      getState()?.auth?.accessToken || localStorage.getItem("accessToken");

    // List of endpoints that should NOT have the JSON content-type header
    const endpointsThatUploadFiles = ["uploadPresentationFiles", "uploadImage"];

    // If the current endpoint is NOT in our list, then set the header
    if (!endpointsThatUploadFiles.includes(endpoint)) {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
