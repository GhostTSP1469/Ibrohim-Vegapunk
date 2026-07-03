import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";
import type { PublicUser } from "../Friends/FriendsZustand";

export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface ProjectChanges {
  name?: string;
  description?: string | null;
  lead_id?: string | null;
}

export interface ChangeRequest {
  id: string;
  workspace_id: string;
  project_id: string;
  requester_id: string;
  reviewer_id: string | null;
  changes: ProjectChanges;
  summary: string;
  status: ChangeRequestStatus;
  created_at: string;
  updated_at: string;
  requester: PublicUser;
  reviewer: PublicUser | null;
}

interface ChangeRequestsState {
  changeRequests: ChangeRequest[];
  loading: boolean;
  error: string | null;
  fetchChangeRequests: (slug: string, projectId: string, status?: ChangeRequestStatus) => Promise<void>;
  createChangeRequest: (slug: string, projectId: string, changes: ProjectChanges) => Promise<boolean>;
  approve: (slug: string, projectId: string, requestId: string) => Promise<boolean>;
  reject: (slug: string, projectId: string, requestId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/change-requests`;

export const useChangeRequestsStore = create<ChangeRequestsState>((set, get) => ({
  changeRequests: [],
  loading: false,
  error: null,

  fetchChangeRequests: async (slug, projectId, status) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId)}/`, {
        params: status ? { status } : undefined,
      });
      set({ changeRequests: asList<ChangeRequest>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createChangeRequest: async (slug, projectId, changes) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, { changes });
      await get().fetchChangeRequests(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  approve: async (slug, projectId, requestId) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${requestId}/approve`);
      await get().fetchChangeRequests(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  reject: async (slug, projectId, requestId) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${requestId}/reject`);
      await get().fetchChangeRequests(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
