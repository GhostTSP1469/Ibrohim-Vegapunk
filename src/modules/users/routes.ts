import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { searchUsersSchema, lookupUserSchema } from './schema.js';
import { searchUsersHandler, lookupUserHandler } from './controller.js';

// Global user directory (`/api/v1/users`). Any authenticated user.
export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/search', { schema: searchUsersSchema, preHandler: [authenticate] }, searchUsersHandler);
  app.get('/lookup', { schema: lookupUserSchema, preHandler: [authenticate] }, lookupUserHandler);
}
