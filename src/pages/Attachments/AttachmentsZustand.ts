import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface Attachment {
  id: string;
  workspace_id: string;
  issue_id: string;
  uploaded_by_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_key: string;
  created_at: string;
  download_url?: string;
}

// POST returns the created attachment plus a presigned upload target.
interface CreateAttachmentResponse {
  attachment: Attachment;
  upload: { url: string; method: string; headers?: Record<string, string>; expires_in?: number };
}

interface AttachmentsState {
  attachments: Attachment[];
  loading: boolean;
  error: string | null;
  fetchAttachments: (slug: string, projectId: string, issueId: string) => Promise<void>;
  createAttachment: (
    slug: string,
    projectId: string,
    issueId: string,
    data: { file_name: string; file_size: number; mime_type: string },
  ) => Promise<CreateAttachmentResponse | null>;
  deleteAttachment: (slug: string, projectId: string, attachmentId: string) => Promise<boolean>;
}

export const useAttachmentsStore = create<AttachmentsState>((set) => ({
  attachments: [],
  loading: false,
  error: null,

  fetchAttachments: async (slug, projectId, issueId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(
        `/workspaces/${slug}/projects/${projectId}/issues/${issueId}/attachments/`,
      );
      set({ attachments: asList<Attachment>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  createAttachment: async (slug, projectId, issueId, data) => {
    try {
      const res = await axiosRequest.post<CreateAttachmentResponse>(
        `/workspaces/${slug}/projects/${projectId}/issues/${issueId}/attachments/`,
        data,
      );
      return res.data;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  // Note: delete lives under the project (not under the issue).
  deleteAttachment: async (slug, projectId, attachmentId) => {
    try {
      await axiosRequest.delete(`/workspaces/${slug}/projects/${projectId}/attachments/${attachmentId}`);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },
}));
