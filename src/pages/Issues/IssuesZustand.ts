import { create } from "zustand";
import { axiosRequest, getErrorMessage } from "../../api";
import { gateFromError } from "../AccessRequests/AccessZustand";

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface Issue {
  id: string;
  workspace_id: string;
  project_id: string;
  sequence_id: number;
  title: string;
  description: string | null;
  state_id: string;
  priority: Priority;
  parent_id: string | null;
  cycle_id: string | null;
  estimate_points: number | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  assignees: unknown[];
  labels: unknown[];
}

interface IssueListResponse {
  data: Issue[];
  next_cursor: string | null;
}

interface CreateIssueInput {
  title: string;
  state_id: string;
  description?: string;
  priority?: Priority;
  parent_id?: string;
  assignee_ids?: string[];
  label_ids?: string[];
  start_date?: string;
  due_date?: string;
  estimate_points?: number;
}

type UpdateIssueInput = Partial<Omit<CreateIssueInput, "assignee_ids" | "label_ids">> & {
  sort_order?: number;
};

interface IssuesState {
  issues: Issue[];
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  fetchIssues: (
    slug: string,
    projectId: string,
    params?: Record<string, string | number>,
  ) => Promise<void>;
  getIssue: (slug: string, projectId: string, issueId: string) => Promise<Issue | null>;
  createIssue: (slug: string, projectId: string, data: CreateIssueInput) => Promise<boolean>;
  updateIssue: (slug: string, projectId: string, issueId: string, data: UpdateIssueInput) => Promise<boolean>;
  deleteIssue: (slug: string, projectId: string, issueId: string) => Promise<boolean>;
  addAssignee: (slug: string, projectId: string, issueId: string, userId: string) => Promise<boolean>;
  removeAssignee: (slug: string, projectId: string, issueId: string, userId: string) => Promise<boolean>;
  addLabel: (slug: string, projectId: string, issueId: string, labelId: string) => Promise<boolean>;
  removeLabel: (slug: string, projectId: string, issueId: string, labelId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string) =>
  `/workspaces/${slug}/projects/${projectId}/issues`;

export const useIssuesStore = create<IssuesState>((set, get) => ({
  issues: [],
  nextCursor: null,
  loading: false,
  error: null,

  fetchIssues: async (slug, projectId, params) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get<IssueListResponse>(`${base(slug, projectId)}/`, { params });
      set({ issues: data.data, nextCursor: data.next_cursor, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  getIssue: async (slug, projectId, issueId) => {
    try {
      const { data } = await axiosRequest.get<Issue>(`${base(slug, projectId)}/${issueId}`);
      return data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  createIssue: async (slug, projectId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/`, data);
      await get().fetchIssues(slug, projectId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateIssue: async (slug, projectId, issueId, data) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId)}/${issueId}`, data);
      await get().fetchIssues(slug, projectId);
      return true;
    } catch (err) {
      // Editing someone else's task without rights → request-permission gate.
      if (!gateFromError(err, slug, "a task", projectId)) set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteIssue: async (slug, projectId, issueId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${issueId}`);
      await get().fetchIssues(slug, projectId);
      return true;
    } catch (err) {
      // Deleting someone else's task without rights → request-permission gate.
      if (!gateFromError(err, slug, "a task", projectId)) set({ error: getErrorMessage(err) });
      return false;
    }
  },

  addAssignee: async (slug, projectId, issueId, userId) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${issueId}/assignees`, { user_id: userId });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeAssignee: async (slug, projectId, issueId, userId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${issueId}/assignees/${userId}`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  addLabel: async (slug, projectId, issueId, labelId) => {
    try {
      await axiosRequest.post(`${base(slug, projectId)}/${issueId}/labels`, { label_id: labelId });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  removeLabel: async (slug, projectId, issueId, labelId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId)}/${issueId}/labels/${labelId}`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
