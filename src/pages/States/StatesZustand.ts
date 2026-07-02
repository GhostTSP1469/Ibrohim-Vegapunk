import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface WorkflowState {
  id: string;
  project_id: string;
  name: string;
  color: string;
  group: StateGroup;
  order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface StateInput {
  name: string;
  color: string;
  group: StateGroup;
  order?: number;
  is_default?: boolean;
}

interface StatesState {
  states: WorkflowState[];
  loading: boolean;
  error: string | null;
  fetchStates: (slug: string, projectId: string) => Promise<void>;
  createState: (slug: string, projectId: string, data: StateInput) => Promise<boolean>;
  updateState: (slug: string, projectId: string, stateId: string, data: Partial<StateInput>) => Promise<boolean>;
  deleteState: (slug: string, projectId: string, stateId: string, transferToStateId?: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/states`;

export const useStatesStore = create<StatesState>((set, get) => ({
  states: [],
  loading: false,
  error: null,

  fetchStates: async (slug, projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId)}/`);
      set({ states: asList<WorkflowState>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createState: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, data);
      await get().fetchStates(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateState: async (slug, projectId, stateId, data) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId)}/${stateId}`, data);
      await get().fetchStates(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteState: async (slug, projectId, stateId, transferToStateId) => {
    try {
      // This DELETE requires a JSON object body (the API validates it as an
      // object); an undefined key is dropped by JSON.stringify → sends `{}`.
      await axiosRequest.delete(`${base(slug, projectId)}/${stateId}`, {
        data: { transfer_to_state_id: transferToStateId },
      });
      await get().fetchStates(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
