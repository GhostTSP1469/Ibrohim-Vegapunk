import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth-hook.js';
import {
  listConversationsSchema,
  createConversationSchema,
  listMessagesSchema,
  sendMessageSchema,
  markConversationReadSchema,
  deleteMessageSchema,
} from './schema.js';
import {
  listConversationsHandler,
  createConversationHandler,
  listMessagesHandler,
  sendMessageHandler,
  markConversationReadHandler,
  deleteMessageHandler,
} from './controller.js';

// Global 1:1 direct messages (`/api/v1/conversations`). All routes require auth;
// participation is enforced per-conversation in the service.
export async function conversationRoutes(app: FastifyInstance): Promise<void> {
  const auth = [authenticate];

  app.get('/', { schema: listConversationsSchema, preHandler: auth }, listConversationsHandler);
  app.post('/', { schema: createConversationSchema, preHandler: auth }, createConversationHandler);
  app.get(
    '/:conversationId/messages',
    { schema: listMessagesSchema, preHandler: auth },
    listMessagesHandler,
  );
  app.post(
    '/:conversationId/messages',
    { schema: sendMessageSchema, preHandler: auth },
    sendMessageHandler,
  );
  app.patch(
    '/:conversationId/read',
    { schema: markConversationReadSchema, preHandler: auth },
    markConversationReadHandler,
  );
  app.delete(
    '/:conversationId/messages/:messageId',
    { schema: deleteMessageSchema, preHandler: auth },
    deleteMessageHandler,
  );
}
