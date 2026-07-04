import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";
import type { PublicUser } from "../Friends/FriendsZustand";
import { useWorkspaceStore } from "../Workspace/WorkspaceZustand";

export type InviteKind = "invite" | "leave";
export type InviteStatus = "pending" | "accepted" | "rejected";
export type WorkspaceRole = "owner" | "admin" | "member" | "guest";

export interface WorkspaceInvite {
  id: string;
  workspace_id: string;
  user_id: string;
  actor_id: string;
  role: WorkspaceRole;
  kind: InviteKind;
  status: InviteStatus;
  created_at: string;
  updated_at: string;
  workspace: { id: string; name: string; slug: string };
  actor: PublicUser;
  user: PublicUser;
}

interface InvitesState {
  invites: WorkspaceInvite[];
  loading: boolean;
  error: string | null;
  fetchInvites: () => Promise<void>;
  accept: (id: string) => Promise<boolean>;
  reject: (id: string) => Promise<boolean>;
}

export const useInvitesStore = create<InvitesState>((set, get) => ({
  invites: [],
  loading: false,
  error: null,

  fetchInvites: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/invites");
      set({ invites: asList<WorkspaceInvite>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  accept: async (id) => {
    try {
      await axiosRequest.post(`/invites/${id}/accept`);
      await get().fetchInvites();
      // Accepting a join invite makes you a member → refresh the workspace list
      // so the new workspace shows in the sidebar without a page refresh.
      void useWorkspaceStore.getState().fetchWorkspaces();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  reject: async (id) => {
    try {
      await axiosRequest.post(`/invites/${id}/reject`);
      await get().fetchInvites();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
