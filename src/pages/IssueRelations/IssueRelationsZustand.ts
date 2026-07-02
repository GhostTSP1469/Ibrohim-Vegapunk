import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export type RelationType = "blocks" | "blocked_by" | "relates_to" | "duplicate" | "duplicate_of";

export interface IssueRelation {
  id: string;
  issue_id: string;
  related_issue_id: string;
  relation_type: RelationType;
  created_at: string;
}

interface IssueRelationsState {
  relations: IssueRelation[];
  loading: boolean;
  error: string | null;
  fetchRelations: (slug: string, projectId: string, issueId: string) => Promise<void>;
  createRelation: (
    slug: string,
    projectId: string,
    issueId: string,
    data: { related_issue_id: string; relation_type: RelationType },
  ) => Promise<boolean>;
  deleteRelation: (slug: string, projectId: string, issueId: string, linkId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string, issueId: string) =>
  `/workspaces/${slug}/projects/${projectId}/issues/${issueId}/relations`;

export const useIssueRelationsStore = create<IssueRelationsState>((set, get) => ({
  relations: [],
  loading: false,
  error: null,

  fetchRelations: async (slug, projectId, issueId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId, issueId)}/`);
      set({ relations: asList<IssueRelation>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createRelation: async (slug, projectId, issueId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId, issueId)}/`, data);
      await get().fetchRelations(slug, projectId, issueId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteRelation: async (slug, projectId, issueId, linkId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId, issueId)}/${linkId}`);
      await get().fetchRelations(slug, projectId, issueId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
