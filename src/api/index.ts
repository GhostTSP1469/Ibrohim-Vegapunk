import axios, { type InternalAxiosRequestConfig } from "axios";

export const SaveTokens = (access: string, refresh: string): void => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const getToken = (): string | null => localStorage.getItem("access");

export const getRefresh = (): string | null => localStorage.getItem("refresh");

export const axiosRequest = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

axiosRequest.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
