import { z } from 'zod';
import type { FastifySchema } from 'fastify';

export const CreateConversationSchema = z.object({
  /** The connected user to open (or reuse) a 1:1 conversation with. */
  user_id: z.string().uuid(),
});
export type CreateConversationBody = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  body: z.string().trim().min(1, 'message body is required').max(5000),
});
export type SendMessageBody = z.infer<typeof SendMessageSchema>;

export const MessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type MessagesQuery = z.infer<typeof MessagesQuerySchema>;

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

const messageShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    conversation_id: { type: 'string' },
    sender_id: { type: 'string' },
    body: { type: 'string' },
    is_read: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    sender: userShape,
  },
} as const;

const conversationShape = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    user_a: userShape,
    user_b: userShape,
    last_message_at: { type: 'string', format: 'date-time' },
    last_message: { ...messageShape, nullable: true },
    unread_count: { type: 'integer' },
  },
} as const;

export const listConversationsSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'List my direct-message conversations (newest activity first)',
  security,
  response: { 200: { type: 'array', items: conversationShape } },
};

export const createConversationSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'Open or reuse a 1:1 conversation with a connected user',
  security,
  body: {
    type: 'object',
    required: ['user_id'],
    properties: { user_id: { type: 'string', format: 'uuid' } },
  },
  response: { 200: conversationShape, 201: conversationShape },
};

export const listMessagesSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'List messages in a conversation (newest first, cursor paginated)',
  security,
  querystring: {
    type: 'object',
    properties: {
      cursor: { type: 'string' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        data: { type: 'array', items: messageShape },
        next_cursor: { type: 'string', nullable: true },
      },
    },
  },
};

export const sendMessageSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'Send a message in a conversation',
  security,
  body: {
    type: 'object',
    required: ['body'],
    properties: { body: { type: 'string', minLength: 1, maxLength: 5000 } },
  },
  response: { 201: messageShape },
};

export const markConversationReadSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'Mark all incoming messages in a conversation as read',
  security,
  response: { 200: { type: 'object', properties: { updated: { type: 'integer' } } } },
};

export const deleteMessageSchema: FastifySchema = {
  tags: ['Conversations'],
  summary: 'Soft-delete your own message',
  security,
  response: { 200: { type: 'object', properties: { deleted: { type: 'boolean' } } } },
};
