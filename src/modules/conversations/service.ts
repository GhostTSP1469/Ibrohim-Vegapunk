import type { PrismaClient, Prisma, Conversation } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import type { MessagesQuery, SendMessageBody } from './schema.js';

const SELECT_USER = { select: { id: true, display_name: true, avatar_url: true } } as const;

const INCLUDE_PARTIES = { user_a: SELECT_USER, user_b: SELECT_USER } as const;

type MessageWithSender = Prisma.MessageGetPayload<{ include: { sender: typeof SELECT_USER } }>;
type PublicUser = Prisma.UserGetPayload<typeof SELECT_USER>;

export interface ConversationSummary {
  id: string;
  user_a: PublicUser;
  user_b: PublicUser;
  last_message_at: Date;
  last_message: MessageWithSender | null;
  unread_count: number;
}

/** Store the pair normalized (a < b) so the unique constraint is order-independent. */
function normalizePair(x: string, y: string): { a: string; b: string } {
  return x < y ? { a: x, b: y } : { a: y, b: x };
}

/** Messaging requires an accepted connection between the two users. */
async function assertConnected(prisma: PrismaClient, u1: string, u2: string): Promise<void> {
  const conn = await prisma.connection.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { requester_id: u1, addressee_id: u2 },
        { requester_id: u2, addressee_id: u1 },
      ],
    },
  });
  if (!conn) throw AppError.forbidden('You can only message users you are connected with');
}

/** Load a conversation and assert the caller is one of its two participants. */
async function assertParticipant(
  prisma: PrismaClient,
  conversationId: string,
  userId: string,
): Promise<Conversation> {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo || (convo.user_a_id !== userId && convo.user_b_id !== userId)) {
    throw AppError.notFound('Conversation not found');
  }
  return convo;
}

/** Get-or-create the 1:1 conversation with another (connected) user. */
export async function getOrCreate(
  prisma: PrismaClient,
  userId: string,
  otherId: string,
): Promise<Prisma.ConversationGetPayload<{ include: typeof INCLUDE_PARTIES }>> {
  if (userId === otherId) throw AppError.badRequest('You cannot message yourself');

  const other = await prisma.user.findUnique({ where: { id: otherId } });
  if (!other) throw AppError.notFound('User not found');

  await assertConnected(prisma, userId, otherId);

  const { a, b } = normalizePair(userId, otherId);
  const existing = await prisma.conversation.findUnique({
    where: { user_a_id_user_b_id: { user_a_id: a, user_b_id: b } },
    include: INCLUDE_PARTIES,
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { user_a_id: a, user_b_id: b },
    include: INCLUDE_PARTIES,
  });
}

/** List the caller's conversations with the other party, last message and unread count. */
export async function listConversations(
  prisma: PrismaClient,
  userId: string,
): Promise<ConversationSummary[]> {
  const convos = await prisma.conversation.findMany({
    where: { OR: [{ user_a_id: userId }, { user_b_id: userId }] },
    include: {
      ...INCLUDE_PARTIES,
      messages: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
        include: { sender: SELECT_USER },
      },
    },
    orderBy: { last_message_at: 'desc' },
  });

  if (convos.length === 0) return [];

  const unread = await prisma.message.groupBy({
    by: ['conversation_id'],
    where: {
      conversation_id: { in: convos.map((c) => c.id) },
      sender_id: { not: userId },
      is_read: false,
      deleted_at: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unread.map((u) => [u.conversation_id, u._count._all]));

  return convos.map((c) => ({
    id: c.id,
    user_a: c.user_a,
    user_b: c.user_b,
    last_message_at: c.last_message_at,
    last_message: c.messages[0] ?? null,
    unread_count: unreadMap.get(c.id) ?? 0,
  }));
}

/** List messages in a conversation (newest first), cursor paginated. */
export async function listMessages(
  prisma: PrismaClient,
  userId: string,
  conversationId: string,
  query: MessagesQuery,
): Promise<{ data: MessageWithSender[]; next_cursor: string | null }> {
  await assertParticipant(prisma, conversationId, userId);

  const limit = query.limit;
  const rows = await prisma.message.findMany({
    where: { conversation_id: conversationId, deleted_at: null },
    include: { sender: SELECT_USER },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const next_cursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;
  return { data, next_cursor };
}

/** Send a message; bumps the conversation's last_message_at. */
export async function sendMessage(
  prisma: PrismaClient,
  userId: string,
  conversationId: string,
  body: SendMessageBody,
): Promise<MessageWithSender> {
  await assertParticipant(prisma, conversationId, userId);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversation_id: conversationId, sender_id: userId, body: body.body },
      include: { sender: SELECT_USER },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() },
    }),
  ]);
  return message;
}

/** Mark all messages sent by the OTHER party in this conversation as read. */
export async function markRead(
  prisma: PrismaClient,
  userId: string,
  conversationId: string,
): Promise<{ updated: number }> {
  await assertParticipant(prisma, conversationId, userId);

  const result = await prisma.message.updateMany({
    where: {
      conversation_id: conversationId,
      sender_id: { not: userId },
      is_read: false,
      deleted_at: null,
    },
    data: { is_read: true },
  });
  return { updated: result.count };
}

/** Soft-delete your own message. */
export async function deleteMessage(
  prisma: PrismaClient,
  userId: string,
  conversationId: string,
  messageId: string,
): Promise<{ deleted: boolean }> {
  await assertParticipant(prisma, conversationId, userId);

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversation_id: conversationId, sender_id: userId, deleted_at: null },
  });
  if (!message) throw AppError.notFound('Message not found');

  await prisma.message.update({ where: { id: messageId }, data: { deleted_at: new Date() } });
  return { deleted: true };
}
