import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";
import type { PublicUser } from "../Friends/FriendsZustand";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender: PublicUser;
}

export interface Conversation {
  id: string;
  user_a: PublicUser;
  user_b: PublicUser;
  last_message_at: string;
  last_message: Message | null;
  unread_count: number;
}

interface MessagesState {
  conversations: Conversation[];
  activeId: string | null;
  messages: Message[]; // chronological (oldest first) for the active conversation
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  openConversation: (userId: string) => Promise<string | null>;
  setActive: (id: string | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<boolean>;
  markRead: (conversationId: string) => Promise<void>;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/conversations");
      set({ conversations: asList<Conversation>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  // Get-or-create a 1:1 conversation and make it active.
  openConversation: async (userId) => {
    try {
      const { data } = await axiosRequest.post<Conversation>("/conversations", { user_id: userId });
      set({ activeId: data.id });
      await get().fetchMessages(data.id);
      await get().fetchConversations();
      return data.id;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  setActive: (id) => set({ activeId: id, messages: [] }),

  fetchMessages: async (conversationId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`/conversations/${conversationId}/messages`);
      // API returns newest-first; reverse for a natural chat order.
      set({ messages: asList<Message>(data).reverse(), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  sendMessage: async (conversationId, body) => {
    try {
      await axiosRequest.post(`/conversations/${conversationId}/messages`, { body });
      await get().fetchMessages(conversationId);
      await get().fetchConversations();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  markRead: async (conversationId) => {
    try {
      await axiosRequest.patch(`/conversations/${conversationId}/read`);
      await get().fetchConversations();
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },
}));
