import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";
import { gateFromError } from "../AccessRequests/AccessZustand";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  user: { id: string; email: string; display_name: string; avatar_url: string | null };
}

interface WorkspaceState {
  workspaces: Workspace[];
  members: WorkspaceMember[];
  loading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  getWorkspace: (slug: string) => Promise<Workspace | null>;
  createWorkspace: (data: { name: string; slug: string }) => Promise<boolean>;
  updateWorkspace: (slug: string, data: { name?: string; slug?: string }) => Promise<boolean>;
  deleteWorkspace: (slug: string) => Promise<boolean>;
  fetchMembers: (slug: string) => Promise<void>;
  addMember: (slug: string, data: { user_id: string; role?: string }) => Promise<boolean>;
  updateMemberRole: (slug: string, userId: string, role: string) => Promise<boolean>;
  removeMember: (slug: string, userId: string) => Promise<boolean>;
  invite: (slug: string, data: { email: string; role: "admin" | "member" }) => Promise<boolean>;
  leaveWorkspace: (slug: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  members: [],
  loading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get("/workspaces/");
      set({ workspaces: asList<Workspace>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  getWorkspace: async (slug) => {
    try {
      const { data } = await axiosRequest.get<Workspace>(`/workspaces/${slug}`);
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  createWorkspace: async (data) => {
    set({ loading: true, error: null });
    try {
      await axiosRequest.post("/workspaces/", data);
      await get().fetchWorkspaces();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
      return false;
    }
  },

  updateWorkspace: async (slug, data) => {
    try {
      await axiosRequest.patch(`/workspaces/${slug}`, data);
      await get().fetchWorkspaces();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteWorkspace: async (slug) => {
    try {
      await axiosRequest.delete(`/workspaces/${slug}`);
      await get().fetchWorkspaces();
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  fetchMembers: async (slug) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`/workspaces/${slug}/members`);
      set({ members: asList<WorkspaceMember>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  addMember: async (slug, data) => {
    try {
      await axiosRequest.post(`/workspaces/${slug}/members`, data);
      await get().fetchMembers(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateMemberRole: async (slug, userId, role) => {
    try {
      await axiosRequest.patch(`/workspaces/${slug}/members/${userId}`, { role });
      await get().fetchMembers(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeMember: async (slug, userId) => {
    try {
      await axiosRequest.delete(`/workspaces/${slug}/members/${userId}`);
      await get().fetchMembers(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  // Invite a user by email with a role (creates a pending invite they accept).
  invite: async (slug, data) => {
    try {
      await axiosRequest.post(`/workspaces/${slug}/invites`, data);
      return true;
    } catch (err) {
      // A member without invite rights gets the "request temporary permission" gate.
      if (!gateFromError(err, slug, "invite members")) set({ error: getErrorMessage(err) });
      return false;
    }
  },

  // Request to leave the workspace (an owner/admin must approve).
  leaveWorkspace: async (slug) => {
    try {
      await axiosRequest.post(`/workspaces/${slug}/leave`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
