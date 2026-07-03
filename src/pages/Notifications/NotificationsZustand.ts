import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export type NotificationType =
  | "issue_assigned"
  | "comment_added"
  | "mentioned"
  | "change_requested"
  | "change_approved"
  | "change_rejected";

export interface Notification {
  id: string;
  workspace_id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  issue_id: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  actor: { id: string; display_name: string; avatar_url: string | null };
}

interface NotificationsResponse {
  data: Notification[];
  unread_count: number;
  next_cursor: string | null;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (slug: string) => Promise<void>;
  markAllRead: (slug: string) => Promise<boolean>;
  markRead: (slug: string, notificationId: string) => Promise<boolean>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (slug) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get<NotificationsResponse>(`/workspaces/${slug}/notifications/`);
      set({
        notifications: asList<Notification>(data),
        unreadCount: data?.unread_count ?? 0,
        loading: false,
      });
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
