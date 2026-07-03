import type { PrismaClient } from '@prisma/client';
import type { UserSearchQuery } from './schema.js';

export interface PublicUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * Search active users by display name (case-insensitive partial match),
 * excluding the caller. Returns only public fields (no email), with cursor
 * pagination like the rest of the API.
 */
export async function searchUsers(
  prisma: PrismaClient,
  currentUserId: string,
  query: UserSearchQuery,
): Promise<{ data: PublicUser[]; next_cursor: string | null }> {
  const limit = query.limit;

  const users = await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      is_active: true,
      // With no query this lists everyone (for a "people you may know" panel);
      // with a query it filters by display name.
      ...(query.query ? { display_name: { contains: query.query, mode: 'insensitive' } } : {}),
    },
    select: { id: true, display_name: true, avatar_url: true },
    orderBy: [{ display_name: 'asc' }, { id: 'asc' }],
    take: limit + 1,
    ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
  });

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;
  const next_cursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

  return { data, next_cursor };
}
