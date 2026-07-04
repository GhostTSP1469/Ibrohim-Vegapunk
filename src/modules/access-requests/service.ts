import type { PrismaClient, Prisma, Workspace, WorkspaceRole } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import { notify } from '../../lib/notifications.js';
import {
  type Capability,
  CAPABILITY_LABEL,
  GRANT_TTL_MS,
  roleHasCapability,
  hasActiveGrant,
} from '../../lib/permissions.js';
import type { CreateAccessRequestBody } from './schema.js';

const INCLUDE = {
  requester: { select: { id: true, display_name: true, avatar_url: true } },
  reviewer: { select: { id: true, display_name: true, avatar_url: true } },
} as const;

type AccessRequestRow = Prisma.AccessRequestGetPayload<{ include: typeof INCLUDE }>;

const isReviewer = (role: WorkspaceRole): boolean => role === 'admin' || role === 'owner';

/**
 * A member asks for a privileged capability they lack. Blocked if they already
 * hold it (by role or an active grant) or already have a pending request for it.
 * Workspace admins/owner are notified so they can review.
 */
export async function createAccessRequest(
  prisma: PrismaClient,
  workspace: Workspace,
  requesterId: string,
  role: WorkspaceRole,
  body: CreateAccessRequestBody,
): Promise<AccessRequestRow> {
  const capability = body.capability as Capability;

  if (roleHasCapability(role, capability) || (await hasActiveGrant(prisma, workspace.id, requesterId, capability))) {
    throw AppError.badRequest(`You can already ${CAPABILITY_LABEL[capability]}.`);
  }

  const duplicate = await prisma.accessRequest.findFirst({
    where: { workspace_id: workspace.id, requester_id: requesterId, capability, status: 'pending' },
    select: { id: true },
  });
  if (duplicate) throw AppError.conflict('You already have a pending request for this permission');

  const request = await prisma.accessRequest.create({
    data: {
      workspace_id: workspace.id,
      requester_id: requesterId,
      capability,
      project_id: body.project_id ?? null,
      target_label: body.target_label ?? null,
      note: body.note ?? null,
      status: 'pending',
    },
    include: INCLUDE,
  });

  const reviewers = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspace.id, role: { in: ['admin', 'owner'] } },
    select: { user_id: true },
  });
  await notify(prisma, {
    workspace_id: workspace.id,
    actor_id: requesterId,
    type: 'change_requested',
    recipient_ids: reviewers.map((r) => r.user_id),
    entity_id: request.id,
  });

  return request;
}

/** Admins/owner see every request in the workspace; members see only their own. */
export async function listAccessRequests(
  prisma: PrismaClient,
  workspace: Workspace,
  userId: string,
  role: WorkspaceRole,
): Promise<AccessRequestRow[]> {
  return prisma.accessRequest.findMany({
    where: {
      workspace_id: workspace.id,
      ...(isReviewer(role) ? {} : { requester_id: userId }),
    },
    include: INCLUDE,
    // Pending first, then most recent.
    orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
  });
}

/** The capabilities the caller currently holds via active grants (role-derived
 *  ones are known to the client from its own role). */
export async function listMyGrants(
  prisma: PrismaClient,
  workspace: Workspace,
  userId: string,
): Promise<{ capability: string; expires_at: Date }[]> {
  return prisma.permissionGrant.findMany({
    where: { workspace_id: workspace.id, user_id: userId, expires_at: { gt: new Date() } },
    select: { capability: true, expires_at: true },
    orderBy: { expires_at: 'desc' },
  });
}

/**
 * Approve or reject a pending request. Approving issues a time-boxed
 * PermissionGrant to the requester; either way the requester is notified.
 */
export async function reviewAccessRequest(
  prisma: PrismaClient,
  workspace: Workspace,
  requestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
): Promise<AccessRequestRow> {
  const request = await prisma.accessRequest.findFirst({
    where: { id: requestId, workspace_id: workspace.id },
  });
  if (!request) throw AppError.notFound('Access request not found');
  if (request.status !== 'pending') throw AppError.conflict('This request has already been reviewed');

  const updated = await prisma.$transaction(async (tx) => {
    if (decision === 'approved') {
      await tx.permissionGrant.create({
        data: {
          workspace_id: workspace.id,
          user_id: request.requester_id,
          capability: request.capability,
          granted_by_id: reviewerId,
          expires_at: new Date(Date.now() + GRANT_TTL_MS),
        },
      });
    }
    return tx.accessRequest.update({
      where: { id: requestId },
      data: { status: decision, reviewer_id: reviewerId },
      include: INCLUDE,
    });
  });

  await notify(prisma, {
    workspace_id: workspace.id,
    actor_id: reviewerId,
    type: decision === 'approved' ? 'change_approved' : 'change_rejected',
    recipient_ids: [request.requester_id],
    entity_id: request.id,
  });

  return updated;
}
