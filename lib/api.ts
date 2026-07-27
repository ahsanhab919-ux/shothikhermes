import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";

interface RetryableAxiosConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

const MAX_RETRIES = 2;
const BASE_DELAY = 1000;
const MAX_DELAY = 5000;

function shouldRetry(error: AxiosError): boolean {
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableAxiosConfig | undefined;
  if (!config) return Promise.reject(error);

  const retryCount = config.__retryCount || 0;
  if (retryCount >= MAX_RETRIES || !shouldRetry(error)) {
    return Promise.reject(error);
  }

  config.__retryCount = retryCount + 1;
  const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return api(config);
});

export default api;
