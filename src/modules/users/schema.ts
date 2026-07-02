import { z } from 'zod';
import type { FastifySchema } from 'fastify';

export const UserSearchQuerySchema = z.object({
  /** Case-insensitive partial match on display_name. */
  query: z.string().trim().min(1, 'query is required'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type UserSearchQuery = z.infer<typeof UserSearchQuerySchema>;

// ─── Fastify route schemas ────────────────────────────────────────────────────

const security = [{ bearerAuth: [] }];

// Public projection — never expose email or other private fields in search.
const publicUserShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    display_name: { type: 'string' },
    avatar_url: { type: 'string', nullable: true },
  },
} as const;

export const searchUsersSchema: FastifySchema = {
  tags: ['Users'],
  summary: 'Search users by display name (to add as members or send friend requests)',
  security,
  querystring: {
    type: 'object',
    required: ['query'],
    properties: {
      query: { type: 'string', minLength: 1 },
      cursor: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'array', items: publicUserShape },
        next_cursor: { type: 'string', nullable: true },
      },
    },
  },
};
