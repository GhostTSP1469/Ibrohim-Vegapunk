import { create } from "zustand";
import { axiosRequest, getErrorMessage, getErrorCapability, asList } from "../../api";
import { isCapability, type Capability } from "../../lib/permissions";
import type { PublicUser } from "../Friends/FriendsZustand";

export type AccessStatus = "pending" | "approved" | "rejected";

export interface AccessRequest {
  id: string;
  workspace_id: string;
  project_id: string | null;
  requester_id: string;
  reviewer_id: string | null;
  capability: Capability;
  target_label: string | null;
  note: string | null;
  status: AccessStatus;
  created_at: string;
  updated_at: string;
  requester: PublicUser;
  reviewer: PublicUser | null;
}

export interface Grant {
  capability: string;
  expires_at: string;
}

// What the "insufficient rights" modal needs to offer a request.
export interface GatePrompt {
  capability: Capability;
  slug: string;
  targetLabel?: string;
  projectId?: string;
}

interface AccessState {
  requests: AccessRequest[];
  grants: Grant[];
  loading: boolean;
  error: string | null;
  gate: GatePrompt | null;
  fetchRequests: (slug: string) => Promise<void>;
  fetchGrants: (slug: string) => Promise<void>;
  createRequest: (
    slug: string,
    body: { capability: Capability; project_id?: string; target_label?: string; note?: string },
  ) => Promise<boolean>;
  approve: (slug: string, id: string) => Promise<boolean>;
  reject: (slug: string, id: string) => Promise<boolean>;
  hasGrant: (cap: Capability) => boolean;
  openGate: (prompt: GatePrompt) => void;
  closeGate: () => void;
}

const base = (slug: string) => `/workspaces/${slug}/access-requests`;

export const useAccessStore = create<AccessState>((set, get) => ({
  requests: [],
  grants: [],
  loading: false,
  error: null,
  gate: null,

  fetchRequests: async (slug) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosRequest.get(`${base(slug)}/`);
      set({ requests: asList<AccessRequest>(data), loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err), loading: false });
    }
  },

  fetchGrants: async (slug) => {
    try {
      const { data } = await axiosRequest.get(`${base(slug)}/grants`);
      set({ grants: asList<Grant>(data) });
    } catch {
      /* grants are best-effort UI hints; ignore failures */
    }
  },

  createRequest: async (slug, body) => {
    try {
      await axiosRequest.post(`${base(slug)}/`, body);
      await get().fetchRequests(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  approve: async (slug, id) => {
    try {
      await axiosRequest.post(`${base(slug)}/${id}/approve`);
      await get().fetchRequests(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  reject: async (slug, id) => {
    try {
      await axiosRequest.post(`${base(slug)}/${id}/reject`);
      await get().fetchRequests(slug);
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return false;
    }
  },

  hasGrant: (cap) => get().grants.some((g) => g.capability === cap && new Date(g.expires_at) > new Date()),

  openGate: (prompt) => set({ gate: prompt }),
  closeGate: () => set({ gate: null }),
}));

/**
 * If `err` is a capability-403, pop the "request temporary permission" gate and
 * return true (so callers can suppress a generic error toast). Otherwise false.
 */
export function gateFromError(err: unknown, slug: string, targetLabel?: string, projectId?: string): boolean {
  const cap = getErrorCapability(err);
  if (cap && isCapability(cap)) {
    useAccessStore.getState().openGate({ capability: cap, slug, targetLabel, projectId });
    return true;
  }
  return false;
}
