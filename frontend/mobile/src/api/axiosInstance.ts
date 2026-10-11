import axios, { AxiosInstance, AxiosError } from "axios";
import { API_BASE_URL } from "../constants/config";
import storage from "../utils/storage";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token automatically if present
axiosInstance.interceptors.request.use(async (config) => {
  const token = await storage.getItem("authToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Custom error shape with a friendly message attached
export interface ApiError extends AxiosError {
  friendlyMessage: string;
}

// Response interceptor: normalize error messages for easier UI handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const friendlyMessage =
      error?.response?.data?.message || "Something went wrong. Please try again.";
    const apiError: ApiError = Object.assign(error, { friendlyMessage });
    return Promise.reject(apiError);
  }
);

export default axiosInstance;