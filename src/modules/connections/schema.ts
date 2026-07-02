import { z } from 'zod';
import type { FastifySchema } from 'fastify';

export const CreateConnectionSchema = z.object({
  /** The user you want to send a friend request to. */
  user_id: z.string().uuid(),
});
export type CreateConnectionBody = z.infer<typeof CreateConnectionSchema>;

export const ListConnectionsQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  direction: z.enum(['incoming', 'outgoing']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListConnectionsQuery = z.infer<typeof ListConnectionsQuerySchema>;

export const UpdateConnectionSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});
export type UpdateConnectionBody = z.infer<typeof UpdateConnectionSchema>;

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

const connectionShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    requester_id: { type: 'string' },
    addressee_id: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    requester: userShape,
    addressee: userShape,
  },
} as const;

export const createConnectionSchema: FastifySchema = {
  tags: ['Connections'],
  summary: 'Send a friend request to a user',
  security,
  body: {
    type: 'object',
    required: ['user_id'],
    properties: { user_id: { type: 'string', format: 'uuid' } },
  },
  response: { 201: connectionShape },
};

export const listConnectionsSchema: FastifySchema = {
  tags: ['Connections'],
  summary: 'List my connections (friends / incoming / outgoing requests)',
  security,
  querystring: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pending', 'accepted', 'rejected'] },
      direction: { type: 'string', enum: ['incoming', 'outgoing'] },
      cursor: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'array', items: connectionShape },
        next_cursor: { type: 'string', nullable: true },
      },
    },
  },
};

export const updateConnectionSchema: FastifySchema = {
  tags: ['Connections'],
  summary: 'Accept or reject a pending friend request (addressee only)',
  security,
  body: {
    type: 'object',
    required: ['status'],
    properties: { status: { type: 'string', enum: ['accepted', 'rejected'] } },
  },
  response: { 200: connectionShape },
};

export const deleteConnectionSchema: FastifySchema = {
  tags: ['Connections'],
  summary: 'Cancel an outgoing request or remove an existing connection',
  security,
  response: {
    200: { type: 'object', properties: { deleted: { type: 'boolean' } } },
  },
};
