import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface PublicUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  requester: PublicUser;
  addressee: PublicUser;
}

interface FriendsState {
  results: PublicUser[];
  connections: Connection[];
  loading: boolean;
  error: string | null;
  searchUsers: (query: string) => Promise<void>;
  clearResults: () => void;
  fetchConnections: (params?: { status?: ConnectionStatus; direction?: "incoming" | "outgoing" }) => Promise<void>;
  sendRequest: (userId: string) => Promise<boolean>;
  respond: (connectionId: string, status: "accepted" | "rejected") => Promise<boolean>;
  removeConnection: (connectionId: string) => Promise<boolean>;
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  results: [],
  connections: [],
  loading: false,
  error: null,

  searchUsers: async (query) => {
    if (!query.trim()) {
      set({ results: [] });
      return;
    }
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/users/search", { params: { query } });
      set({ results: asList<PublicUser>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  clearResults: () => set({ results: [] }),

  fetchConnections: async (params) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/connections", { params });
      set({ connections: asList<Connection>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  sendRequest: async (userId) => {
    try {
      await axiosRequest.post("/connections", { user_id: userId });
      await get().fetchConnections();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  respond: async (connectionId, status) => {
    try {
      await axiosRequest.patch(`/connections/${connectionId}`, { status });
      await get().fetchConnections();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeConnection: async (connectionId) => {
    try {
      await axiosRequest.delete(`/connections/${connectionId}`);
      await get().fetchConnections();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
