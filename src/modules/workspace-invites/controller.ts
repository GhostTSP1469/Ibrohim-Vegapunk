import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service.js';
import { assertCapability } from '../../lib/permissions.js';
import { InviteBodySchema } from './schema.js';

export async function inviteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = InviteBodySchema.parse(request.body);
  // Admins/owner may invite directly; a member needs the `invite_member` grant.
  await assertCapability(
    request.server.prisma,
    request.workspace.id,
    request.userId,
    request.workspaceMember.role,
    'invite_member',
  );
  const invite = await service.invite(request.server.prisma, request.workspace, request.userId, body);
  reply.code(201).send(invite);
}

export async function leaveHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const invite = await service.requestLeave(
    request.server.prisma,
    request.workspace,
    request.userId,
    request.workspaceMember.role,
  );
  reply.code(201).send(invite);
}

export async function listInvitesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const list = await service.listMyInvites(request.server.prisma, request.userId);
  reply.send(list);
}

export async function acceptInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { inviteId } = request.params as { inviteId: string };
  const invite = await service.respond(request.server.prisma, inviteId, request.userId, 'accepted');
  reply.send(invite);
}

export async function rejectInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { inviteId } = request.params as { inviteId: string };
  const invite = await service.respond(request.server.prisma, inviteId, request.userId, 'rejected');
  reply.send(invite);
}
