import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Cycle {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CycleInput {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface CyclesState {
  cycles: Cycle[];
  loading: boolean;
  error: string | null;
  fetchCycles: (slug: string, projectId: string) => Promise<void>;
  getCycle: (slug: string, projectId: string, cycleId: string) => Promise<Cycle | null>;
  createCycle: (slug: string, projectId: string, data: CycleInput) => Promise<boolean>;
  updateCycle: (slug: string, projectId: string, cycleId: string, data: Partial<CycleInput>) => Promise<boolean>;
  deleteCycle: (slug: string, projectId: string, cycleId: string) => Promise<boolean>;
  addIssues: (slug: string, projectId: string, cycleId: string, issueIds: string[]) => Promise<boolean>;
  removeIssue: (slug: string, projectId: string, cycleId: string, issueId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/cycles`;

export const useCyclesStore = create<CyclesState>((set, get) => ({
  cycles: [],
  loading: false,
  error: null,

  fetchCycles: async (slug, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId)}/`);
      set({ cycles: asList<Cycle>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  getCycle: async (slug, projectId, cycleId) => {
    try {
      const { data } = await axiosRequest.get<Cycle>(`${base(slug, projectId)}/${cycleId}`);
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  createCycle: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, data);
      await get().fetchCycles(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateCycle: async (slug, projectId, cycleId, data) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId)}/${cycleId}`, data);
      await get().fetchCycles(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteCycle: async (slug, projectId, cycleId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${cycleId}`);
      await get().fetchCycles(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  addIssues: async (slug, projectId, cycleId, issueIds) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${cycleId}/issues`, { issue_ids: issueIds });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeIssue: async (slug, projectId, cycleId, issueId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${cycleId}/issues/${issueId}`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
