import { z } from 'zod';
import type { FastifySchema } from 'fastify';
import { CAPABILITIES } from '../../lib/permissions.js';

const capabilityEnum = z.enum(CAPABILITIES);

export const CreateAccessRequestSchema = z.object({
  capability: capabilityEnum,
  project_id: z.string().uuid().nullable().optional(),
  target_label: z.string().max(200).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});
export type CreateAccessRequestBody = z.infer<typeof CreateAccessRequestSchema>;

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

const accessRequestShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    workspace_id: { type: 'string' },
    project_id: { type: 'string', nullable: true },
    requester_id: { type: 'string' },
    reviewer_id: { type: 'string', nullable: true },
    capability: { type: 'string', enum: [...CAPABILITIES] },
    target_label: { type: 'string', nullable: true },
    note: { type: 'string', nullable: true },
    status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    requester: userShape,
    reviewer: { ...userShape, nullable: true },
  },
} as const;

export const createAccessRequestSchema: FastifySchema = {
  tags: ['Access Requests'],
  summary: 'Request temporary permission for a privileged action (members)',
  security,
  body: {
    type: 'object',
    required: ['capability'],
    properties: {
      capability: { type: 'string', enum: [...CAPABILITIES] },
      project_id: { type: 'string', format: 'uuid', nullable: true },
      target_label: { type: 'string', maxLength: 200, nullable: true },
      note: { type: 'string', maxLength: 1000, nullable: true },
    },
  },
  response: { 201: accessRequestShape },
};

export const listAccessRequestsSchema: FastifySchema = {
  tags: ['Access Requests'],
  summary: 'List access requests (admins see all; members see their own)',
  security,
  response: { 200: { type: 'array', items: accessRequestShape } },
};

export const listGrantsSchema: FastifySchema = {
  tags: ['Access Requests'],
  summary: 'My active temporary permission grants in this workspace',
  security,
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          capability: { type: 'string' },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const approveAccessRequestSchema: FastifySchema = {
  tags: ['Access Requests'],
  summary: 'Approve a request — grants 24h temporary permission (admin+)',
  security,
  response: { 200: accessRequestShape },
};

export const rejectAccessRequestSchema: FastifySchema = {
  tags: ['Access Requests'],
  summary: 'Reject an access request (admin+)',
  security,
  response: { 200: accessRequestShape },
};
