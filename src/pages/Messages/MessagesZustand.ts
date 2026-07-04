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
  messages: Message[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  // messageId -> locally edited body. The backend has no edit endpoint, so
  // edits live only in this browser and are reapplied over server data.
  editedIds: Record<string, string>;

  fetchConversations: () => Promise<void>;
  openConversation: (userId: string) => Promise<string | null>;
  setActive: (id: string | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, body: string) => Promise<boolean>;
  markRead: (conversationId: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  editMessage: (conversationId: string, messageId: string, body: string) => Promise<boolean>;
}

const safeId = (id: string | null | undefined) =>
  id && id.trim() !== "" ? id : null;

/* =======================
   LOCAL EDIT OVERLAY
   Persisted in localStorage since the API has no edit endpoint.
======================= */
const EDIT_STORE_KEY = "dm_edited_messages_v1";

function loadEditOverlay(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EDIT_STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveEditOverlay(overlay: Record<string, string>) {
  try {
    localStorage.setItem(EDIT_STORE_KEY, JSON.stringify(overlay));
  } catch {
    // Storage unavailable (private mode / quota) — edit still works this session.
  }
}

function applyOverlay(messages: Message[], overlay: Record<string, string>): Message[] {
  const safeOverlay = overlay ?? {};
  return messages.map((m) => (safeOverlay[m.id] !== undefined ? { ...m, body: safeOverlay[m.id] } : m));
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  nextCursor: null,
  loading: false,
  error: null,
  editedIds: loadEditOverlay(),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/conversations/");
      set({ conversations: asList<Conversation>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  openConversation: async (userId) => {
    try {
      if (!userId?.trim()) return null;

      const { data } = await axiosRequest.post<Conversation>(
        "/conversations/",
        { user_id: userId }
      );

      set({ activeId: data.id });

      await get().fetchMessages(data.id);
      await get().fetchConversations();

      return data.id;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  setActive: (id) => {
    set({ activeId: id, messages: [], nextCursor: null });
  },

  fetchMessages: async (conversationId) => {
    const safe = safeId(conversationId);
    if (!safe) return;

    set({ loading: true, error: null });

    try {
      const { data } = await axiosRequest.get(
        `/conversations/${safe}/messages`,
        { params: { limit: 50 } }
      );

      const fresh = asList<Message>(data).reverse();
      set({
        messages: applyOverlay(fresh, get().editedIds),
        nextCursor: data?.next_cursor ?? null,
        loading: false,
      });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  loadOlderMessages: async (conversationId) => {
    const safe = safeId(conversationId);
    const cursor = get().nextCursor;
    if (!safe || !cursor) return;

    set({ loading: true, error: null });

    try {
      const { data } = await axiosRequest.get(
        `/conversations/${safe}/messages`,
        { params: { cursor, limit: 50 } }
      );

      const olderOldestFirst = applyOverlay(asList<Message>(data).reverse(), get().editedIds);

      set((state) => ({
        messages: [...olderOldestFirst, ...state.messages],
        nextCursor: data?.next_cursor ?? null,
        loading: false,
      }));
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  sendMessage: async (conversationId, body) => {
    const safe = safeId(conversationId);
    if (!safe || !body?.trim()) return false;

    try {
      const { data: newMessage } = await axiosRequest.post<Message>(
        `/conversations/${safe}/messages`,
        { body }
      );

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      await get().fetchConversations();

      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  markRead: async (conversationId) => {
    const safe = safeId(conversationId);
    if (!safe) return;

    try {
      await axiosRequest.patch(`/conversations/${safe}/read`);
      await get().fetchConversations();
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  deleteMessage: async (conversationId, messageId) => {
    const safeConv = safeId(conversationId);
    const safeMsg = safeId(messageId);
    if (!safeConv || !safeMsg) return false;

    const prevMessages = get().messages;
    set({ messages: prevMessages.filter((m) => m.id !== safeMsg) });

    try {
      await axiosRequest.delete(
        `/conversations/${safeConv}/messages/${safeMsg}`
      );
      await get().fetchConversations();

      const rest = { ...get().editedIds };
      delete rest[safeMsg];
      set({ editedIds: rest });
      saveEditOverlay(rest);

      return true;
    } catch (err) {
      set({ messages: prevMessages, error: getErrorMessage(err) });
      return false;
    }
  },

  // Local-only edit: no backend route exists for this, so it's stored in
  // localStorage and reapplied over server data on every fetch. Instant,
  // works offline, but only visible in this browser.
  editMessage: async (_conversationId, messageId, body) => {
    const trimmed = body?.trim();
    if (!trimmed) return false;

    const overlay = { ...get().editedIds, [messageId]: trimmed };

    set((state) => ({
      editedIds: overlay,
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, body: trimmed } : m)),
    }));
    saveEditOverlay(overlay);

    return true;
  },
}));