import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { requireWorkspaceMember } from '../../plugins/workspace-hook.js';
import {
  inviteSchema,
  leaveSchema,
  listInvitesSchema,
  acceptInviteSchema,
  rejectInviteSchema,
} from './schema.js';
import {
  inviteHandler,
  leaveHandler,
  listInvitesHandler,
  acceptInviteHandler,
  rejectInviteHandler,
} from './controller.js';

// Workspace-scoped: invite a user (admin+) or request to leave (any member).
// Registered at `/api/v1/workspaces/:workspaceSlug`.
export async function workspaceInviteRoutes(app: FastifyInstance): Promise<void> {
  const member = [authenticate, requireWorkspaceMember()];

  // Any member may reach the invite route; the handler enforces the
  // `invite_member` capability (admins/owner have it; members need a grant).
  app.post('/invites', { schema: inviteSchema, preHandler: member }, inviteHandler);
  app.post('/leave', { schema: leaveSchema, preHandler: member }, leaveHandler);
}

// Global: my pending invites + leave requests I can approve.
// Registered at `/api/v1/invites`. Any authenticated user; per-invite rules in service.
export async function inviteRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  app.get('/', { schema: listInvitesSchema, preHandler: auth }, listInvitesHandler);
  app.post('/:inviteId/accept', { schema: acceptInviteSchema, preHandler: auth }, acceptInviteHandler);
  app.post('/:inviteId/reject', { schema: rejectInviteSchema, preHandler: auth }, rejectInviteHandler);
}
