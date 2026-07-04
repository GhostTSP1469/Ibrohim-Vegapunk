import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { requireWorkspaceMember } from '../../plugins/workspace-hook.js';
import {
  createAccessRequestSchema,
  listAccessRequestsSchema,
  listGrantsSchema,
  approveAccessRequestSchema,
  rejectAccessRequestSchema,
} from './schema.js';
import {
  createAccessRequestHandler,
  listAccessRequestsHandler,
  listGrantsHandler,
  approveAccessRequestHandler,
  rejectAccessRequestHandler,
} from './controller.js';

// Permission-request flow. A member requests a privileged capability; admin+
// approve (issuing a 24h grant) or reject. Registered at
// `/api/v1/workspaces/:workspaceSlug/access-requests`.
export async function accessRequestRoutes(app: FastifyInstance): Promise<void> {
  const member = [authenticate, requireWorkspaceMember()];
  const admin = [authenticate, requireWorkspaceMember('admin')];

  app.get('/', { schema: listAccessRequestsSchema, preHandler: member }, listAccessRequestsHandler);
  app.get('/grants', { schema: listGrantsSchema, preHandler: member }, listGrantsHandler);
  app.post('/', { schema: createAccessRequestSchema, preHandler: member }, createAccessRequestHandler);
  app.post(
    '/:requestId/approve',
    { schema: approveAccessRequestSchema, preHandler: admin },
    approveAccessRequestHandler,
  );
  app.post(
    '/:requestId/reject',
    { schema: rejectAccessRequestSchema, preHandler: admin },
    rejectAccessRequestHandler,
  );
}
