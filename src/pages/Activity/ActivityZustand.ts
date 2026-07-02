import { create } from "zustand";
import { axiosRequest, getErrorMessage, asList } from "../../api";

export interface ActivityEntry {
  id: string;
  issue_id: string;
  actor_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor?: { id: string; display_name: string; avatar_url: string | null };
}

interface ActivityState {
  activity: ActivityEntry[];
  loading: boolean;
  error: string | null;
  fetchActivity: (slug: string, projectId: string, issueId: string) => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activity: [],
  loading: false,
  error: null,

  fetchActivity: async (slug, projectId, issueId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(
        `/workspaces/${slug}/projects/${projectId}/issues/${issueId}/activity/`,
      );
      set({ activity: asList<ActivityEntry>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },
}));
