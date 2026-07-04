import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";
import { gateFromError } from "../AccessRequests/AccessZustand";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  identifier: string;
  description: string | null;
  lead_id: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user: { id: string; email: string; display_name: string; avatar_url: string | null };
}

export interface LookedUpUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
}

interface ProjectsState {
  projects: Project[];
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  fetchProjects: (slug: string) => Promise<void>;
  getProject: (slug: string, projectId: string) => Promise<Project | null>;
  createProject: (
    slug: string,
    data: { name: string; identifier: string; description?: string; lead_id?: string },
  ) => Promise<boolean>;
  updateProject: (
    slug: string,
    projectId: string,
    data: { name?: string; description?: string; lead_id?: string; is_archived?: boolean },
  ) => Promise<boolean>;
  deleteProject: (slug: string, projectId: string) => Promise<boolean>;
  fetchMembers: (slug: string, projectId: string) => Promise<void>;
  addMember: (slug: string, projectId: string, data: { user_id: string; role?: string }) => Promise<boolean>;
  removeMember: (slug: string, projectId: string, userId: string) => Promise<boolean>;
  lookupByEmail: (email: string) => Promise<LookedUpUser | null>;
}

const base = (slug: string) => `/workspaces/${slug}/projects`;

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  members: [],
  loading: false,
  error: null,

  fetchProjects: async (slug) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug)}/`);
      set({ projects: asList<Project>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  getProject: async (slug, projectId) => {
    try {
      const { data } = await axiosRequest.get<Project>(`${base(slug)}/${projectId}`);
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  createProject: async (slug, data) => {
    set({ loading: true, error: null });
    try {
      await axiosRequest.post(`${base(slug)}/`, data);
      await get().fetchProjects(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
      return false;
    }
  },

  updateProject: async (slug, projectId, data) => {
    try {
      await axiosRequest.patch(`${base(slug)}/${projectId}`, data);
      await get().fetchProjects(slug);
      return true;
    } catch (err) {
      // A member without settings rights gets the "request temporary permission" gate.
      if (!gateFromError(err, slug, "project settings", projectId)) set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteProject: async (slug, projectId) => {
    try {
      await axiosRequest.delete(`${base(slug)}/${projectId}`);
      await get().fetchProjects(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  fetchMembers: async (slug, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug)}/${projectId}/members`);
      set({ members: asList<ProjectMember>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  addMember: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug)}/${projectId}/members`, data);
      await get().fetchMembers(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeMember: async (slug, projectId, userId) => {
    try {
      await axiosRequest.delete(`${base(slug)}/${projectId}/members/${userId}`);
      await get().fetchMembers(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  // Resolve an email to a user (for the add-member-by-email modal).
  // Returns null when no user has that email (or on any error).
  lookupByEmail: async (email) => {
    try {
      const { data } = await axiosRequest.get<LookedUpUser>("/users/lookup", { params: { email } });
      return data;
    } catch {
      return null;
    }
  },
}));
