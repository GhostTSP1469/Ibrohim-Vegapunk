import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Module {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: string | null;
  lead_id: string | null;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ModuleInput {
  name: string;
  description?: string;
  status?: string;
  lead_id?: string;
  start_date?: string;
  target_date?: string;
}

interface ModulesState {
  modules: Module[];
  loading: boolean;
  error: string | null;
  fetchModules: (slug: string, projectId: string) => Promise<void>;
  getModule: (slug: string, projectId: string, moduleId: string) => Promise<Module | null>;
  createModule: (slug: string, projectId: string, data: ModuleInput) => Promise<boolean>;
  updateModule: (slug: string, projectId: string, moduleId: string, data: Partial<ModuleInput>) => Promise<boolean>;
  deleteModule: (slug: string, projectId: string, moduleId: string) => Promise<boolean>;
  addIssues: (slug: string, projectId: string, moduleId: string, issueIds: string[]) => Promise<boolean>;
  removeIssue: (slug: string, projectId: string, moduleId: string, issueId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/modules`;

export const useModulesStore = create<ModulesState>((set, get) => ({
  modules: [],
  loading: false,
  error: null,

  fetchModules: async (slug, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId)}/`);
      set({ modules: asList<Module>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  getModule: async (slug, projectId, moduleId) => {
    try {
      const { data } = await axiosRequest.get<Module>(`${base(slug, projectId)}/${moduleId}`);
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  createModule: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, data);
      await get().fetchModules(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateModule: async (slug, projectId, moduleId, data) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId)}/${moduleId}`, data);
      await get().fetchModules(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteModule: async (slug, projectId, moduleId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${moduleId}`);
      await get().fetchModules(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  addIssues: async (slug, projectId, moduleId, issueIds) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${moduleId}/issues`, { issue_ids: issueIds });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeIssue: async (slug, projectId, moduleId, issueId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${moduleId}/issues/${issueId}`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
