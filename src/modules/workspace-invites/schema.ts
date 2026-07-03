import { z } from 'zod';
import type { FastifySchema } from 'fastify';

export const InviteBodySchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['admin', 'member']).default('member'),
});
export type InviteBody = z.infer<typeof InviteBodySchema>;

// ─── Fastify route schemas ────────────────────────────────────────────────────

const security = [{ bearerAuth: [] }];

const userShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    display_name: { type: 'string' },
    avatar_url: { type: 'string', nullable: true },
  },
} as const;

const inviteShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    workspace_id: { type: 'string' },
    user_id: { type: 'string' },
    actor_id: { type: 'string' },
    role: { type: 'string', enum: ['owner', 'admin', 'member', 'guest'] },
    kind: { type: 'string', enum: ['invite', 'leave'] },
    status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    workspace: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' } },
    },
    actor: userShape,
    user: userShape,
  },
} as const;

export const inviteSchema: FastifySchema = {
  tags: ['Workspace Invites'],
  summary: 'Invite a user (by email) to the workspace with a role (admin+)',
  security,
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['admin', 'member'], default: 'member' },
    },
  },
  response: { 201: inviteShape },
};

export const leaveSchema: FastifySchema = {
  tags: ['Workspace Invites'],
  summary: 'Request to leave the workspace (owner must approve)',
  security,
  response: { 201: inviteShape },
};

export const listInvitesSchema: FastifySchema = {
  tags: ['Workspace Invites'],
  summary: 'My pending invites + leave requests I can approve',
  security,
  response: { 200: { type: 'array', items: inviteShape } },
};

export const acceptInviteSchema: FastifySchema = {
  tags: ['Workspace Invites'],
  summary: 'Accept an invite (join) / approve a leave request',
  security,
  response: { 200: inviteShape },
};

export const rejectInviteSchema: FastifySchema = {
  tags: ['Workspace Invites'],
  summary: 'Reject an invite / deny a leave request',
  security,
  response: { 200: inviteShape },
};
