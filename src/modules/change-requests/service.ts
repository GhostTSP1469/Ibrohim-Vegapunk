import type { PrismaClient, Prisma, Workspace, WorkspaceRole } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import { notify } from '../../lib/notifications.js';
import type { CreateChangeRequestBody, ListChangeRequestsQuery } from './schema.js';

const INCLUDE = {
  requester: { select: { id: true, display_name: true, avatar_url: true } },
  reviewer: { select: { id: true, display_name: true, avatar_url: true } },
} as const;

type ChangeRequest = Prisma.ProjectChangeRequestGetPayload<{ include: typeof INCLUDE }>;
type ProjectChanges = { name?: string; description?: string | null; lead_id?: string | null };

async function assertProject(prisma: PrismaClient, workspaceId: string, projectId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspace_id: workspaceId },
    select: { id: true },
  });
  if (!project) throw AppError.notFound('Project not found');
}

function summarize(changes: ProjectChanges): string {
  const parts: string[] = [];
  if (changes.name !== undefined) parts.push(`name to "${changes.name}"`);
  if (changes.description !== undefined) parts.push('description');
  if (changes.lead_id !== undefined) parts.push('lead');
  return `Requested to change project ${parts.join(', ')}`;
}

const isReviewer = (role: WorkspaceRole): boolean => role === 'admin' || role === 'owner';

/** A member submits a project-settings change; workspace admins/owner are notified. */
export async function createChangeRequest(
  prisma: PrismaClient,
  workspace: Workspace,
  projectId: string,
  requesterId: string,
  body: CreateChangeRequestBody,
): Promise<ChangeRequest> {
  await assertProject(prisma, workspace.id, projectId);

  const request = await prisma.projectChangeRequest.create({
    data: {
      workspace_id: workspace.id,
      project_id: projectId,
      requester_id: requesterId,
      changes: body.changes as Prisma.InputJsonValue,
      summary: summarize(body.changes),
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

/** List requests. Admins/owner see all for the project; members see only their own. */
export async function listChangeRequests(
  prisma: PrismaClient,
  workspace: Workspace,
  projectId: string,
  userId: string,
  role: WorkspaceRole,
  query: ListChangeRequestsQuery,
): Promise<ChangeRequest[]> {
  await assertProject(prisma, workspace.id, projectId);
  return prisma.projectChangeRequest.findMany({
    where: {
      project_id: projectId,
      ...(query.status && { status: query.status }),
      ...(isReviewer(role) ? {} : { requester_id: userId }),
    },
    include: INCLUDE,
    orderBy: [{ created_at: 'desc' }],
  });
}

/** Approve (apply the change) or reject a pending request; the requester is notified. */
export async function review(
  prisma: PrismaClient,
  workspace: Workspace,
  projectId: string,
  requestId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
): Promise<ChangeRequest> {
  await assertProject(prisma, workspace.id, projectId);

  const request = await prisma.projectChangeRequest.findFirst({
    where: { id: requestId, project_id: projectId },
  });
  if (!request) throw AppError.notFound('Change request not found');
  if (request.status !== 'pending') throw AppError.conflict('This request has already been reviewed');

  if (decision === 'approved') {
    const changes = request.changes as ProjectChanges;
    await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.description !== undefined && { description: changes.description }),
        ...(changes.lead_id !== undefined && { lead_id: changes.lead_id }),
      },
    });
  }

  const updated = await prisma.projectChangeRequest.update({
    where: { id: requestId },
    data: { status: decision, reviewer_id: reviewerId },
    include: INCLUDE,
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
