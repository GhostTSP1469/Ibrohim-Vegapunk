import type { PrismaClient, Prisma, Workspace, WorkspaceRole } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import type { InviteBody } from './schema.js';

const INCLUDE = {
  workspace: { select: { id: true, name: true, slug: true } },
  actor: { select: { id: true, display_name: true, avatar_url: true } },
  user: { select: { id: true, display_name: true, avatar_url: true } },
} as const;

type Invite = Prisma.WorkspaceInviteGetPayload<{ include: typeof INCLUDE }>;

/** Owner/admin invites a user (by email) to join with a role. */
export async function invite(
  prisma: PrismaClient,
  workspace: Workspace,
  actorId: string,
  body: InviteBody,
): Promise<Invite> {
  const target = await prisma.user.findFirst({
    where: { email: { equals: body.email, mode: 'insensitive' }, is_active: true },
  });
  if (!target) throw AppError.notFound('No user found with that email');
  if (target.id === actorId) throw AppError.badRequest('You cannot invite yourself');

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspace_id_user_id: { workspace_id: workspace.id, user_id: target.id } },
  });
  if (existingMember) throw AppError.conflict('User is already a member of this workspace');

  const pending = await prisma.workspaceInvite.findFirst({
    where: { workspace_id: workspace.id, user_id: target.id, kind: 'invite', status: 'pending' },
  });
  if (pending) throw AppError.conflict('An invitation is already pending for this user');

  return prisma.workspaceInvite.create({
    data: {
      workspace_id: workspace.id,
      user_id: target.id,
      actor_id: actorId,
      role: body.role,
      kind: 'invite',
      status: 'pending',
    },
    include: INCLUDE,
  });
}

/** A member asks to leave; an owner/admin must approve. */
export async function requestLeave(
  prisma: PrismaClient,
  workspace: Workspace,
  userId: string,
  memberRole: WorkspaceRole,
): Promise<Invite> {
  if (memberRole === 'owner') throw AppError.forbidden('The owner cannot leave the workspace');

  const pending = await prisma.workspaceInvite.findFirst({
    where: { workspace_id: workspace.id, user_id: userId, kind: 'leave', status: 'pending' },
  });
  if (pending) throw AppError.conflict('You already have a pending leave request');

  return prisma.workspaceInvite.create({
    data: {
      workspace_id: workspace.id,
      user_id: userId,
      actor_id: userId,
      role: memberRole,
      kind: 'leave',
      status: 'pending',
    },
    include: INCLUDE,
  });
}

/** Invites I received (to join) + leave requests I can approve (as owner/admin). */
export async function listMyInvites(prisma: PrismaClient, userId: string): Promise<Invite[]> {
  const adminMemberships = await prisma.workspaceMember.findMany({
    where: { user_id: userId, role: { in: ['owner', 'admin'] } },
    select: { workspace_id: true },
  });
  const adminWorkspaceIds = adminMemberships.map((m) => m.workspace_id);

  return prisma.workspaceInvite.findMany({
    where: {
      status: 'pending',
      OR: [
        { kind: 'invite', user_id: userId },
        { kind: 'leave', workspace_id: { in: adminWorkspaceIds } },
      ],
    },
    include: INCLUDE,
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Accept/reject. For `invite` only the invitee may respond (accept → joins).
 * For `leave` only a workspace admin/owner may respond (accept → member removed).
 */
export async function respond(
  prisma: PrismaClient,
  inviteId: string,
  userId: string,
  decision: 'accepted' | 'rejected',
): Promise<Invite> {
  const inv = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
  if (!inv) throw AppError.notFound('Invite not found');
  if (inv.status !== 'pending') throw AppError.conflict('This request has already been handled');

  if (inv.kind === 'invite') {
    if (inv.user_id !== userId) throw AppError.forbidden('This invitation is not addressed to you');
    if (decision === 'accepted') {
      const existing = await prisma.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: inv.workspace_id, user_id: inv.user_id } },
      });
      if (!existing) {
        await prisma.workspaceMember.create({
          data: { workspace_id: inv.workspace_id, user_id: inv.user_id, role: inv.role },
        });
      }
    }
  } else {
    const approver = await prisma.workspaceMember.findUnique({
      where: { workspace_id_user_id: { workspace_id: inv.workspace_id, user_id: userId } },
    });
    if (!approver || (approver.role !== 'owner' && approver.role !== 'admin')) {
      throw AppError.forbidden('Only an admin or owner can approve leave requests');
    }
    if (decision === 'accepted') {
      const leaving = await prisma.workspaceMember.findUnique({
        where: { workspace_id_user_id: { workspace_id: inv.workspace_id, user_id: inv.user_id } },
      });
      if (leaving && leaving.role !== 'owner') {
        await prisma.workspaceMember.delete({
          where: { workspace_id_user_id: { workspace_id: inv.workspace_id, user_id: inv.user_id } },
        });
      }
    }
  }

  return prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: decision },
    include: INCLUDE,
  });
}
