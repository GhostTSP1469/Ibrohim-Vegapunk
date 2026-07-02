import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import {
  createConnectionSchema,
  listConnectionsSchema,
  updateConnectionSchema,
  deleteConnectionSchema,
} from './schema.js';
import {
  createConnectionHandler,
  listConnectionsHandler,
  updateConnectionHandler,
  deleteConnectionHandler,
} from './controller.js';

// Global friend-request graph (`/api/v1/connections`). All routes require auth.
export async function connectionRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  app.get('/', { schema: listConnectionsSchema, preHandler: auth }, listConnectionsHandler);
  app.post('/', { schema: createConnectionSchema, preHandler: auth }, createConnectionHandler);
  app.patch('/:connectionId', { schema: updateConnectionSchema, preHandler: auth }, updateConnectionHandler);
  app.delete('/:connectionId', { schema: deleteConnectionSchema, preHandler: auth }, deleteConnectionHandler);
}
