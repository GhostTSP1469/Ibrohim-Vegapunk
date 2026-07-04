import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service.js';
import { CreateAccessRequestSchema } from './schema.js';

export async function createAccessRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = CreateAccessRequestSchema.parse(request.body);
  const ar = await service.createAccessRequest(
    request.server.prisma,
    request.workspace,
    request.userId,
    request.workspaceMember.role,
    body,
  );
  reply.code(201).send(ar);
}

export async function listAccessRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const list = await service.listAccessRequests(
    request.server.prisma,
    request.workspace,
    request.userId,
    request.workspaceMember.role,
  );
  reply.send(list);
}

export async function listGrantsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const grants = await service.listMyGrants(request.server.prisma, request.workspace, request.userId);
  reply.send(grants);
}

export async function approveAccessRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { requestId } = request.params as { requestId: string };
  const ar = await service.reviewAccessRequest(
    request.server.prisma,
    request.workspace,
    requestId,
    request.userId,
    'approved',
  );
  reply.send(ar);
}

export async function rejectAccessRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { requestId } = request.params as { requestId: string };
  const ar = await service.reviewAccessRequest(
    request.server.prisma,
    request.workspace,
    requestId,
    request.userId,
    'rejected',
  );
  reply.send(ar);
}
