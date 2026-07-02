import type { FastifyRequest, FastifyReply } from 'fastify';
import * as userService from './service.js';
import { UserSearchQuerySchema } from './schema.js';

export async function searchUsersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const query = UserSearchQuerySchema.parse(request.query);
  const result = await userService.searchUsers(request.server.prisma, request.userId, query);
  reply.send(result);
}
