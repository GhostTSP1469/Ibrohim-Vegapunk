import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import { requireWorkspaceMember } from '../../plugins/workspace-hook.js';
import {
  listWorkspacesSchema,
  createWorkspaceSchema,
  getWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  listMembersSchema,
  listMemberProjectsSchema,
  addMemberSchema,
  changeMemberRoleSchema,
  removeMemberSchema,
} from './schema.js';
import {
  listWorkspacesHandler,
  createWorkspaceHandler,
  getWorkspaceHandler,
  updateWorkspaceHandler,
  deleteWorkspaceHandler,
  listMembersHandler,
  listMemberProjectsHandler,
  addMemberHandler,
  changeMemberRoleHandler,
  removeMemberHandler,
} from './controller.js';

export async function workspaceRoutes(app: FastifyInstance): Promise<void> {
  // Collection routes (no workspace scope yet — just need auth)
  app.get('/', { schema: listWorkspacesSchema, preHandler: [authenticate] }, listWorkspacesHandler);
  app.post(
    '/',
    { schema: createWorkspaceSchema, preHandler: [authenticate] },
    createWorkspaceHandler,
  );

  // Workspace-scoped routes — resolves workspace + verifies membership
  app.get(
    '/:workspaceSlug',
    {
      schema: getWorkspaceSchema,
      preHandler: [authenticate, requireWorkspaceMember()],
    },
    getWorkspaceHandler,
  );
  app.patch(
    '/:workspaceSlug',
    {
      schema: updateWorkspaceSchema,
      preHandler: [authenticate, requireWorkspaceMember('admin')],
    },
    updateWorkspaceHandler,
  );
  app.delete(
    '/:workspaceSlug',
    {
      schema: deleteWorkspaceSchema,
      preHandler: [authenticate, requireWorkspaceMember('owner')],
    },
    deleteWorkspaceHandler,
  );

  // Member sub-routes
  app.get(
    '/:workspaceSlug/members',
    {
      schema: listMembersSchema,
      preHandler: [authenticate, requireWorkspaceMember()],
    },
    listMembersHandler,
  );
  app.get(
    '/:workspaceSlug/members/:userId/projects',
    {
      schema: listMemberProjectsSchema,
      preHandler: [authenticate, requireWorkspaceMember()],
    },
    listMemberProjectsHandler,
  );
  app.post(
    '/:workspaceSlug/members',
    {
      schema: addMemberSchema,
      preHandler: [authenticate, requireWorkspaceMember('admin')],
    },
    addMemberHandler,
  );
  // Promoting/demoting members is owner-only (see permission matrix).
  app.patch(
    '/:workspaceSlug/members/:userId',
    {
      schema: changeMemberRoleSchema,
      preHandler: [authenticate, requireWorkspaceMember('owner')],
    },
    changeMemberRoleHandler,
  );
  app.delete(
    '/:workspaceSlug/members/:userId',
    {
      schema: removeMemberSchema,
      preHandler: [authenticate, requireWorkspaceMember('admin')],
    },
    removeMemberHandler,
  );
}
