import { z } from 'zod';
import type { FastifySchema } from 'fastify';

// The project-settings fields a member may request changing.
export const ChangeSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    lead_id: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to change' });

export const CreateChangeRequestSchema = z.object({
  changes: ChangeSchema,
});
export type CreateChangeRequestBody = z.infer<typeof CreateChangeRequestSchema>;

export const ListChangeRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});
export type ListChangeRequestsQuery = z.infer<typeof ListChangeRequestsQuerySchema>;

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

const changeRequestShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    workspace_id: { type: 'string' },
    project_id: { type: 'string' },
    requester_id: { type: 'string' },
    reviewer_id: { type: 'string', nullable: true },
    changes: { type: 'object', additionalProperties: true },
    summary: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    requester: userShape,
    reviewer: { ...userShape, nullable: true },
  },
} as const;

const changesBody = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 2000, nullable: true },
    lead_id: { type: 'string', format: 'uuid', nullable: true },
  },
} as const;

export const createChangeRequestSchema: FastifySchema = {
  tags: ['Change Requests'],
  summary: 'Request a project-settings change (for members without edit rights)',
  security,
  body: {
    type: 'object',
    required: ['changes'],
    properties: { changes: changesBody },
  },
  response: { 201: changeRequestShape },
};

export const listChangeRequestsSchema: FastifySchema = {
  tags: ['Change Requests'],
  summary: 'List change requests (admins see all; members see their own)',
  security,
  querystring: {
    type: 'object',
    properties: { status: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
  },
  response: { 200: { type: 'array', items: changeRequestShape } },
};

export const approveChangeRequestSchema: FastifySchema = {
  tags: ['Change Requests'],
  summary: 'Approve a change request — applies the change (admin+)',
  security,
  response: { 200: changeRequestShape },
};

export const rejectChangeRequestSchema: FastifySchema = {
  tags: ['Change Requests'],
  summary: 'Reject a change request (admin+)',
  security,
  response: { 200: changeRequestShape },
};
