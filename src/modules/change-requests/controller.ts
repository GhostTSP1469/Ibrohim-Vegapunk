import type { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service.js';
import { CreateChangeRequestSchema, ListChangeRequestsQuerySchema } from './schema.js';

export async function createChangeRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = CreateChangeRequestSchema.parse(request.body);
  const { projectId } = request.params as { projectId: string };
  const cr = await service.createChangeRequest(
    request.server.prisma,
    request.workspace,
    projectId,
    request.userId,
    body,
  );
  reply.code(201).send(cr);
}

export async function listChangeRequestsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = ListChangeRequestsQuerySchema.parse(request.query);
  const { projectId } = request.params as { projectId: string };
  const list = await service.listChangeRequests(
    request.server.prisma,
    request.workspace,
    projectId,
    request.userId,
    request.workspaceMember.role,
    query,
  );
  reply.send(list);
}

export async function approveChangeRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, requestId } = request.params as { projectId: string; requestId: string };
  const cr = await service.review(
    request.server.prisma,
    request.workspace,
    projectId,
    requestId,
    request.userId,
    'approved',
  );
  reply.send(cr);
}

export async function rejectChangeRequestHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { projectId, requestId } = request.params as { projectId: string; requestId: string };
  const cr = await service.review(
    request.server.prisma,
    request.workspace,
    projectId,
    requestId,
    request.userId,
    'rejected',
  );
  reply.send(cr);
}
