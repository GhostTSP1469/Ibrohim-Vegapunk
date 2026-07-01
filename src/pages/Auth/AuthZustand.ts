import { create } from "zustand";
import { isAxiosError } from "axios";
import { axiosRequest, SaveTokens, getRefresh } from "../../api";

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface UpdateProfileInput {
  display_name?: string;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (email: string, password: string, display_name: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  updateProfile: (data: UpdateProfileInput) => Promise<boolean>;
  getMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Backend error envelope is { error: { code, message, details } }.
function toMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? err.message;
  }
  return "Unexpected error";
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  register: async (email, password, display_name) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.post<AuthResponse>("/auth/register", {
        email,
        password,
        display_name,
      });
      SaveTokens(data.access_token, data.refresh_token);
      set({ user: data.user, loading: false });
      return true;
    } catch (err) {
      set({ error: toMessage(err), loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.post<AuthResponse>("/auth/login", {
        email,
        password,
      });
      SaveTokens(data.access_token, data.refresh_token);
      set({ user: data.user, loading: false });
      return true;
    } catch (err) {
      set({ error: toMessage(err), loading: false });
      return false;
    }
  },

  // PATCH /auth/me — updates display name and/or avatar. Token is attached
  // automatically by the axios request interceptor.
  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: user } = await axiosRequest.patch<User>("/auth/me", data);
      set({ user, loading: false });
      return true;
    } catch (err) {
      set({ error: toMessage(err), loading: false });
      return false;
    }
  },

  getMe: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get<User>("/auth/me");
      set({ user: data, loading: false });
    } catch (err) {
      set({ error: toMessage(err), loading: false });
    }
  },

  clearError: () => set({ error: null }),

  logout: async () => {
    const refresh = getRefresh();
    try {
      if (refresh) {
        await axiosRequest.post("/auth/logout", { refresh_token: refresh });
      }
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      set({ user: null });
    }
  },
}));
