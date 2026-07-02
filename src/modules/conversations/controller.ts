import type { FastifyRequest, FastifyReply } from 'fastify';
import * as conversationService from './service.js';
import { CreateConversationSchema, SendMessageSchema, MessagesQuerySchema } from './schema.js';

export async function listConversationsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const result = await conversationService.listConversations(request.server.prisma, request.userId);
  reply.send(result);
}

export async function createConversationHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = CreateConversationSchema.parse(request.body);
  const conversation = await conversationService.getOrCreate(
    request.server.prisma,
    request.userId,
    body.user_id,
  );
  reply.send(conversation);
}

export async function listMessagesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { conversationId } = request.params as { conversationId: string };
  const query = MessagesQuerySchema.parse(request.query);
  const result = await conversationService.listMessages(
    request.server.prisma,
    request.userId,
    conversationId,
    query,
  );
  reply.send(result);
}

export async function sendMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { conversationId } = request.params as { conversationId: string };
  const body = SendMessageSchema.parse(request.body);
  const message = await conversationService.sendMessage(
    request.server.prisma,
    request.userId,
    conversationId,
    body,
  );
  reply.code(201).send(message);
}

export async function markConversationReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { conversationId } = request.params as { conversationId: string };
  const result = await conversationService.markRead(
    request.server.prisma,
    request.userId,
    conversationId,
  );
  reply.send(result);
}

export async function deleteMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { conversationId, messageId } = request.params as {
    conversationId: string;
    messageId: string;
  };
  const result = await conversationService.deleteMessage(
    request.server.prisma,
    request.userId,
    conversationId,
    messageId,
  );
  reply.send(result);
}
