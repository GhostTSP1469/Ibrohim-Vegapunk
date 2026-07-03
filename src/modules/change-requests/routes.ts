import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { requireWorkspaceMember } from '../../plugins/workspace-hook.js';
import {
  createChangeRequestSchema,
  listChangeRequestsSchema,
  approveChangeRequestSchema,
  rejectChangeRequestSchema,
} from './schema.js';
import {
  createChangeRequestHandler,
  listChangeRequestsHandler,
  approveChangeRequestHandler,
  rejectChangeRequestHandler,
} from './controller.js';

// Project change-request approval flow. Any workspace member can submit a
// request; only admin+ can approve/reject (approving applies the change).
export async function changeRequestRoutes(app: FastifyInstance): Promise<void> {
  const member = [authenticate, requireWorkspaceMember()];
  const admin = [authenticate, requireWorkspaceMember('admin')];

  app.get('/', { schema: listChangeRequestsSchema, preHandler: member }, listChangeRequestsHandler);
  app.post('/', { schema: createChangeRequestSchema, preHandler: member }, createChangeRequestHandler);
  app.post(
    '/:requestId/approve',
    { schema: approveChangeRequestSchema, preHandler: admin },
    approveChangeRequestHandler,
  );
  app.post(
    '/:requestId/reject',
    { schema: rejectChangeRequestSchema, preHandler: admin },
    rejectChangeRequestHandler,
  );
}
