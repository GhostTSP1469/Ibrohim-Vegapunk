import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;

export const SaveTokens = (access: string, refresh: string): void => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const getToken = (): string | null => localStorage.getItem("access");

export const getRefresh = (): string | null => localStorage.getItem("refresh");

export const clearTokens = (): void => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

// Pull a human message out of the backend error envelope { error: { message } }.
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message;
  }
  return "Unexpected error";
};

export const axiosRequest = axios.create({ baseURL });

// Attach the access token to every outgoing request.
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

// The access token lives ~15 min. On a 401 we transparently rotate the token
// pair via /auth/refresh (a raw axios call, so it doesn't re-enter this
// interceptor) and replay the original request once. If refresh fails, clear
// the session and send the user back to /auth.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

axiosRequest.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const original = error.config as RetriableConfig | undefined;
    const refresh = getRefresh();

    if (!original || original._retry || !refresh) {
      clearTokens();
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
        `${baseURL}/auth/refresh`,
        { refresh_token: refresh },
      );
      SaveTokens(data.access_token, data.refresh_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      return axiosRequest(original);
    } catch (refreshError) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
      return Promise.reject(refreshError);
    }
  },
);
