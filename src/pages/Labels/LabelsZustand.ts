import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Label {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

interface LabelInput {
  name: string;
  color: string;
}

interface LabelsState {
  labels: Label[];
  loading: boolean;
  error: string | null;
  fetchLabels: (slug: string, projectId: string) => Promise<void>;
  createLabel: (slug: string, projectId: string, data: LabelInput) => Promise<boolean>;
  updateLabel: (slug: string, projectId: string, labelId: string, data: Partial<LabelInput>) => Promise<boolean>;
  deleteLabel: (slug: string, projectId: string, labelId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/labels`;

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  loading: false,
  error: null,

  fetchLabels: async (slug, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId)}/`);
      set({ labels: asList<Label>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createLabel: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, data);
      await get().fetchLabels(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateLabel: async (slug, projectId, labelId, data) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId)}/${labelId}`, data);
      await get().fetchLabels(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteLabel: async (slug, projectId, labelId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${labelId}`);
      await get().fetchLabels(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
