import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { searchUsersSchema } from './schema.js';
import { searchUsersHandler } from './controller.js';

// Global user directory search (`/api/v1/users`). Any authenticated user.
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/search', { schema: searchUsersSchema, preHandler: [authenticate] }, searchUsersHandler);
}
