import { z } from 'zod';
import type { FastifySchema } from 'fastify';

// ─── Zod validators ──────────────────────────────────────────────────────────

export const CreateTodoBodySchema = z.object({
  title: z.string().min(1).max(500),
});

export const UpdateTodoBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export type CreateTodoBody = z.infer<typeof CreateTodoBodySchema>;
export type UpdateTodoBody = z.infer<typeof UpdateTodoBodySchema>;

// ─── Fastify route schemas (OpenAPI + response serialization) ─────────────────

const todoShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    completed: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

const security = [{ bearerAuth: [] }];

export const listTodosSchema: FastifySchema = {
  tags: ['Todos'],
  summary: "List the current user's todos",
  security,
  response: { 200: { type: 'array', items: todoShape } },
};

export const getTodoSchema: FastifySchema = {
  tags: ['Todos'],
  summary: 'Get a single todo',
  security,
  response: { 200: todoShape },
};

export const createTodoSchema: FastifySchema = {
  tags: ['Todos'],
  summary: 'Create a todo',
  security,
  body: {
    type: 'object',
    required: ['title'],
    properties: { title: { type: 'string', minLength: 1, maxLength: 500 } },
  },
  response: { 201: todoShape },
};

export const updateTodoSchema: FastifySchema = {
  tags: ['Todos'],
  summary: 'Update a todo (title and/or completed). Empty body toggles completed.',
  security,
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 500 },
      completed: { type: 'boolean' },
    },
  },
  response: { 200: todoShape },
};

export const deleteTodoSchema: FastifySchema = {
  tags: ['Todos'],
  summary: 'Delete a todo',
  security,
  response: { 204: { type: 'null' } },
};
