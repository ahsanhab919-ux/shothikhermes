import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@/config/env';

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem('jwt_token');
};

const removeTokenAndRedirect = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem('jwt_token');
  window.location.href = '/auth/login';
};

// Create an axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.api_url || 'https://prod-api.shothik.ai',
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeTokenAndRedirect();
    } else {
      if (!error.response) {
        if (error.message.includes('timeout')) {
          return Promise.reject(new Error('Network timeout, please try again later.'));
        }
        return Promise.reject(new Error('Network error, please check your connection.'));
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Helper function for error handling
export function handleError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    return error.response.data.message || 'An error occurred. Please try again later.';
  }
  return 'An unexpected error occurred. Please check your connection and try again later.';
}

export { apiClient };