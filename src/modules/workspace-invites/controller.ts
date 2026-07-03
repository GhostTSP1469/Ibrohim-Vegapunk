import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service.js';
import { InviteBodySchema } from './schema.js';

export async function inviteHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = InviteBodySchema.parse(request.body);
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
