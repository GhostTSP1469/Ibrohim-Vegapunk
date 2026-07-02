import type { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../../lib/errors.js';
import type { ListConnectionsQuery, UpdateConnectionBody } from './schema.js';

const INCLUDE_USERS = {
  requester: { select: { id: true, display_name: true, avatar_url: true } },
  addressee: { select: { id: true, display_name: true, avatar_url: true } },
} as const;

type ConnectionWithUsers = Prisma.ConnectionGetPayload<{ include: typeof INCLUDE_USERS }>;

/** Send a friend request. Blocks self-requests and duplicates; re-opens a rejected pair. */
export async function sendRequest(
  prisma: PrismaClient,
  requesterId: string,
  addresseeId: string,
): Promise<ConnectionWithUsers> {
  if (requesterId === addresseeId) throw AppError.badRequest('You cannot connect with yourself');

  const target = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!target) throw AppError.notFound('User not found');

  const existing = await prisma.connection.findFirst({
    where: {
      OR: [
        { requester_id: requesterId, addressee_id: addresseeId },
        { requester_id: addresseeId, addressee_id: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'accepted') throw AppError.conflict('You are already connected');
    if (existing.status === 'pending') throw AppError.conflict('A pending request already exists');
    // rejected → re-open as a fresh request from the current user
    return prisma.connection.update({
      where: { id: existing.id },
      data: { requester_id: requesterId, addressee_id: addresseeId, status: 'pending' },
      include: INCLUDE_USERS,
    });
  }

  return prisma.connection.create({
    data: { requester_id: requesterId, addressee_id: addresseeId, status: 'pending' },
    include: INCLUDE_USERS,
  });
}

/** List the caller's connections, filterable by status and direction. */
export async function listConnections(
  prisma: PrismaClient,
  userId: string,
  query: ListConnectionsQuery,
): Promise<{ data: ConnectionWithUsers[]; next_cursor: string | null }> {
  const direction: Prisma.ConnectionWhereInput =
    query.direction === 'incoming'
      ? { addressee_id: userId }
      : query.direction === 'outgoing'
        ? { requester_id: userId }
        : { OR: [{ requester_id: userId }, { addressee_id: userId }] };

  const where: Prisma.ConnectionWhereInput = {
    ...direction,
    ...(query.status && { status: query.status }),
  };

  const limit = query.limit;
  const rows = await prisma.connection.findMany({
    where,
    include: INCLUDE_USERS,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const next_cursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;
  return { data, next_cursor };
}

/** Accept/reject a pending request. Only the addressee may respond. */
export async function respond(
  prisma: PrismaClient,
  userId: string,
  connectionId: string,
  body: UpdateConnectionBody,
): Promise<ConnectionWithUsers> {
  const conn = await prisma.connection.findUnique({ where: { id: connectionId } });
  if (!conn || conn.addressee_id !== userId) {
    throw AppError.notFound('Connection request not found');
  }
  if (conn.status !== 'pending') throw AppError.conflict('This request has already been handled');

  return prisma.connection.update({
    where: { id: connectionId },
    data: { status: body.status },
    include: INCLUDE_USERS,
  });
}

/** Cancel an outgoing request or remove an accepted connection. Either party may. */
export async function remove(
  prisma: PrismaClient,
  userId: string,
  connectionId: string,
): Promise<{ deleted: boolean }> {
  const conn = await prisma.connection.findFirst({
    where: { id: connectionId, OR: [{ requester_id: userId }, { addressee_id: userId }] },
  });
  if (!conn) throw AppError.notFound('Connection not found');

  await prisma.connection.delete({ where: { id: connectionId } });
  return { deleted: true };
}
