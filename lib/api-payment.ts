import axios, { InternalAxiosRequestConfig } from "axios";

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_PAYMENT_SYSTEM_URL ||
    "https://payment-qa-svc.shothik.ai",
  timeout: 5000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;
