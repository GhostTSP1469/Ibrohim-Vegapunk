import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author?: { id: string; display_name: string; avatar_url: string | null };
}

interface CommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  fetchComments: (slug: string, projectId: string, issueId: string) => Promise<void>;
  createComment: (
    slug: string,
    projectId: string,
    issueId: string,
    data: { body: string; parent_comment_id?: string },
  ) => Promise<boolean>;
  updateComment: (
    slug: string,
    projectId: string,
    issueId: string,
    commentId: string,
    body: string,
  ) => Promise<boolean>;
  deleteComment: (slug: string, projectId: string, issueId: string, commentId: string) => Promise<boolean>;
}

const base = (slug: string, projectId: string, issueId: string) =>
  `/workspaces/${slug}/projects/${projectId}/issues/${issueId}/comments`;

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchComments: async (slug, projectId, issueId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug, projectId, issueId)}/`);
      set({ comments: asList<Comment>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createComment: async (slug, projectId, issueId, data) => {
    try {
      await axiosRequest.post(`${base(slug, projectId, issueId)}/`, data);
      await get().fetchComments(slug, projectId, issueId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  updateComment: async (slug, projectId, issueId, commentId, body) => {
    try {
      await axiosRequest.patch(`${base(slug, projectId, issueId)}/${commentId}`, { body });
      await get().fetchComments(slug, projectId, issueId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  deleteComment: async (slug, projectId, issueId, commentId) => {
    try {
      await axiosRequest.delete(`${base(slug, projectId, issueId)}/${commentId}`);
      await get().fetchComments(slug, projectId, issueId);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
