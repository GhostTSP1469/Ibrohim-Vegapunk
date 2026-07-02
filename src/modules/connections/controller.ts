import type { FastifyRequest, FastifyReply } from 'fastify';
import * as connectionService from './service.js';
import {
  CreateConnectionSchema,
  ListConnectionsQuerySchema,
  UpdateConnectionSchema,
} from './schema.js';

export async function createConnectionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = CreateConnectionSchema.parse(request.body);
  const connection = await connectionService.sendRequest(
    request.server.prisma,
    request.userId,
    body.user_id,
  );
  reply.code(201).send(connection);
}

export async function listConnectionsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = ListConnectionsQuerySchema.parse(request.query);
  const result = await connectionService.listConnections(
    request.server.prisma,
    request.userId,
    query,
  );
  reply.send(result);
}

export async function updateConnectionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { connectionId } = request.params as { connectionId: string };
  const body = UpdateConnectionSchema.parse(request.body);
  const connection = await connectionService.respond(
    request.server.prisma,
    request.userId,
    connectionId,
    body,
  );
  reply.send(connection);
}

export async function deleteConnectionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { connectionId } = request.params as { connectionId: string };
  const result = await connectionService.remove(
    request.server.prisma,
    request.userId,
    connectionId,
  );
  reply.send(result);
}
