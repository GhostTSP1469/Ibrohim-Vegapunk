import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  fetchNotifications: (slug: string) => Promise<void>;
  markAllRead: (slug: string) => Promise<boolean>;
  markRead: (slug: string, notificationId: string) => Promise<boolean>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async (slug) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`/workspaces/${slug}/notifications/`);
      set({ notifications: asList<Notification>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  markAllRead: async (slug) => {
    try {
      await axiosRequest.post(`/workspaces/${slug}/notifications/read-all`);
      await get().fetchNotifications(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  markRead: async (slug, notificationId) => {
    try {
      await axiosRequest.post(`/workspaces/${slug}/notifications/${notificationId}/read`);
      await get().fetchNotifications(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
