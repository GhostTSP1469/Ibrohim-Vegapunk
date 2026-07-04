import type { PrismaClient, WorkspaceRole } from '@prisma/client';
import { AppError } from './errors.js';

// ─── Capability model ─────────────────────────────────────────────────────────
//
// A capability is a privileged action that members do NOT have by default. Each
// maps to a minimum workspace role that holds it inherently. A member can obtain
// a capability temporarily via an approved AccessRequest → PermissionGrant.
//
// Role hierarchy (matches workspace-hook ROLE_RANK): owner > admin > member > guest.
// The four capabilities below are exactly the ones a member may request; the
// owner-only actions (manage roles, delete project/workspace) are enforced by
// route-level role guards and are never grantable through this system.

export const CAPABILITIES = [
  'edit_others_task',
  'delete_others_task',
  'invite_member',
  'change_project_settings',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export function isCapability(value: string): value is Capability {
  return (CAPABILITIES as readonly string[]).includes(value);
}

/** Human-readable label per capability (used in notifications / API responses). */
export const CAPABILITY_LABEL: Record<Capability, string> = {
  edit_others_task: "edit other members' tasks",
  delete_others_task: "delete other members' tasks",
  invite_member: 'invite members',
  change_project_settings: 'change project settings',
};

const ROLE_RANK: Record<WorkspaceRole, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/** Minimum role that inherently holds each capability. */
const CAPABILITY_MIN_ROLE: Record<Capability, WorkspaceRole> = {
  edit_others_task: 'admin',
  delete_others_task: 'admin',
  invite_member: 'admin',
  change_project_settings: 'admin',
};

/** How long an approved grant lasts. */
export const GRANT_TTL_MS = 24 * 60 * 60 * 1000;

/** True when the role itself is high enough for the capability. */
export function roleHasCapability(role: WorkspaceRole, capability: Capability): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[CAPABILITY_MIN_ROLE[capability]];
}

/** True when the user holds an unexpired PermissionGrant for the capability. */
export async function hasActiveGrant(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  capability: Capability,
): Promise<boolean> {
  const grant = await prisma.permissionGrant.findFirst({
    where: {
      workspace_id: workspaceId,
      user_id: userId,
      capability,
      expires_at: { gt: new Date() },
    },
    select: { id: true },
  });
  return grant !== null;
}

/** Whether the member can perform the capability, by role or by active grant. */
export async function canPerform(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  capability: Capability,
): Promise<boolean> {
  if (roleHasCapability(role, capability)) return true;
  return hasActiveGrant(prisma, workspaceId, userId, capability);
}

/**
 * Throw a 403 unless the member can perform the capability. The thrown error
 * carries `details.capability` so the client can offer to request access.
 */
export async function assertCapability(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
  capability: Capability,
): Promise<void> {
  if (await canPerform(prisma, workspaceId, userId, role, capability)) return;
  throw AppError.forbidden(
    `You don't have permission to ${CAPABILITY_LABEL[capability]}. Request temporary access from an admin.`,
    { capability },
  );
}

/** List the capabilities the member currently holds (role + active grants). */
export async function listCapabilities(
  prisma: PrismaClient,
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<Capability[]> {
  const held: Capability[] = [];
  const needGrantCheck: Capability[] = [];
  for (const cap of CAPABILITIES) {
    if (roleHasCapability(role, cap)) held.push(cap);
    else needGrantCheck.push(cap);
  }
  if (needGrantCheck.length > 0) {
    const grants = await prisma.permissionGrant.findMany({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        capability: { in: needGrantCheck },
        expires_at: { gt: new Date() },
      },
      select: { capability: true },
    });
    for (const g of grants) {
      if (isCapability(g.capability) && !held.includes(g.capability)) held.push(g.capability);
    }
  }
  return held;
}
