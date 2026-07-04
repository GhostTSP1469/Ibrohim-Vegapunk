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

// The API expects dates as full ISO datetimes; <input type="date"> gives
// "YYYY-MM-DD". Convert (empty → undefined so the field is simply omitted).
export const toIsoDate = (value?: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined;

// Some list endpoints return a bare array, others wrap it as { data: [...] }
// (cursor pagination). Normalise both to a plain array so the UI never crashes.
export const asList = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  const inner = (payload as { data?: unknown } | null | undefined)?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
};

// Pull a human message out of the backend error envelope { error: { message } }.
export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message;
  }
  return "Unexpected error";
};

// A 403 from a capability-guarded action carries { error: { details: { capability } } }.
// Returns that capability string so the UI can offer to request temporary access.
export const getErrorCapability = (err: unknown): string | null => {
  if (!axios.isAxiosError(err) || err.response?.status !== 403) return null;
  const data = err.response?.data as { error?: { details?: { capability?: string } } } | undefined;
  return data?.error?.details?.capability ?? null;
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

// On a 401 we transparently rotate the token pair via /auth/refresh and replay
// the original request once. Because the backend ROTATES (revokes) the refresh
// token on every use, several requests failing at once must NOT each call
// refresh — the first would revoke the token and the rest would fail, logging
// the user out. So refresh is single-flight: concurrent 401s await one shared
// refresh call.
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function rotateTokens(): Promise<string> {
  const refresh = getRefresh();
  if (!refresh) throw new Error("No refresh token");
  // Raw axios (not axiosRequest) so it doesn't re-enter this interceptor.
  const { data } = await axios.post<{ access_token: string; refresh_token: string }>(
    `${baseURL}/auth/refresh`,
    { refresh_token: refresh },
  );
  SaveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

axiosRequest.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const original = error.config as RetriableConfig | undefined;
    if (!original || original._retry || !getRefresh()) {
      return Promise.reject(error);
    }
    original._retry = true;

    try {
      // Share one in-flight refresh across all concurrent 401s.
      refreshPromise ??= rotateTokens().finally(() => {
        refreshPromise = null;
      });
      const newAccess = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccess}`;
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
