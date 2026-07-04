// Client mirror of the backend capability model (src/lib/permissions.ts).
// The backend is authoritative — this only drives UI (hiding controls, wording).

export const CAPABILITIES = [
  "edit_others_task",
  "delete_others_task",
  "invite_member",
  "change_project_settings",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";

export const CAPABILITY_LABEL: Record<Capability, string> = {
  edit_others_task: "Edit other members' tasks",
  delete_others_task: "Delete other members' tasks",
  invite_member: "Invite members",
  change_project_settings: "Change project settings",
};

const ROLE_RANK: Record<WorkspaceRole, number> = { guest: 0, member: 1, admin: 2, owner: 3 };

// All four requestable capabilities are held inherently by admin and owner.
const CAPABILITY_MIN_ROLE: Record<Capability, WorkspaceRole> = {
  edit_others_task: "admin",
  delete_others_task: "admin",
  invite_member: "admin",
  change_project_settings: "admin",
};

export function isCapability(value: string): value is Capability {
  return (CAPABILITIES as readonly string[]).includes(value);
}

/** Whether the role inherently holds the capability (ignores temporary grants). */
export function roleHasCapability(role: WorkspaceRole | undefined, cap: Capability): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[CAPABILITY_MIN_ROLE[cap]];
}

export const isReviewerRole = (role: WorkspaceRole | undefined): boolean =>
  role === "admin" || role === "owner";
