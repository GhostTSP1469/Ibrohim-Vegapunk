import type { FastifyRequest, FastifyReply } from 'fastify';
import * as issueService from './service.js';
import { assertCapability, type Capability } from '../../lib/permissions.js';
import {
  CreateIssueBodySchema,
  UpdateIssueBodySchema,
  IssueFilterQuerySchema,
  AssigneeBodySchema,
  LabelAttachBodySchema,
} from './schema.js';

/**
 * Members may freely edit/delete their OWN issues; touching someone else's issue
 * requires the matching capability (by role, or a temporary grant). No-op when the
 * issue doesn't exist — the service raises the not-found afterwards.
 */
async function assertCanTouchIssue(
  request: FastifyRequest,
  projectId: string,
  issueId: string,
  capability: Capability,
): Promise<void> {
  const issue = await request.server.prisma.issue.findFirst({
    where: { id: issueId, project_id: projectId, deleted_at: null },
    select: { created_by_id: true },
  });
  if (!issue || issue.created_by_id === request.userId) return;
  await assertCapability(
    request.server.prisma,
    request.workspace.id,
    request.userId,
    request.workspaceMember.role,
    capability,
  );
}

export async function listIssuesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId } = request.params as { projectId: string };
  const query = IssueFilterQuerySchema.parse(request.query);
  const result = await issueService.listIssues(
    request.server.prisma,
    request.workspace.id,
    projectId,
    query,
  );
  reply.send(result);
}

export async function createIssueHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId } = request.params as { projectId: string };
  const body = CreateIssueBodySchema.parse(request.body);
  const issue = await issueService.createIssue(
    request.server.prisma,
    request.workspace.id,
    projectId,
    request.userId,
    body,
  );
  reply.code(201).send(issue);
}

export async function getIssueHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { projectId, issueId } = request.params as { projectId: string; issueId: string };
  const issue = await issueService.getIssue(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
  );
  reply.send(issue);
}

export async function updateIssueHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, issueId } = request.params as { projectId: string; issueId: string };
  const body = UpdateIssueBodySchema.parse(request.body);
  await assertCanTouchIssue(request, projectId, issueId, 'edit_others_task');
  const issue = await issueService.updateIssue(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
    body,
  );
  reply.send(issue);
}

export async function deleteIssueHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, issueId } = request.params as { projectId: string; issueId: string };
  await assertCanTouchIssue(request, projectId, issueId, 'delete_others_task');
  await issueService.deleteIssue(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
  );
  reply.code(204).send();
}

export async function addAssigneeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, issueId } = request.params as { projectId: string; issueId: string };
  const { user_id } = AssigneeBodySchema.parse(request.body);
  const issue = await issueService.addAssignee(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
    user_id,
  );
  reply.code(201).send(issue);
}

export async function removeAssigneeHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, issueId, userId } = request.params as {
    projectId: string;
    issueId: string;
    userId: string;
  };
  const issue = await issueService.removeAssignee(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
    userId,
  );
  reply.send(issue);
}

export async function addLabelHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { projectId, issueId } = request.params as { projectId: string; issueId: string };
  const { label_id } = LabelAttachBodySchema.parse(request.body);
  const issue = await issueService.attachLabel(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
    label_id,
  );
  reply.code(201).send(issue);
}

export async function removeLabelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, issueId, labelId } = request.params as {
    projectId: string;
    issueId: string;
    labelId: string;
  };
  const issue = await issueService.detachLabel(
    request.server.prisma,
    request.workspace.id,
    projectId,
    issueId,
    request.userId,
    labelId,
  );
  reply.send(issue);
}
