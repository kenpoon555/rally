import { getTotalUnreadCount } from './chatService';

const STALE_MS = 30_000;

type UnreadEntry = {
  count: number;
  fetchedAt: number;
};

const unreadByUser = new Map<string, UnreadEntry>();

export function getCachedUnreadCount(userId: string): number | null {
  const entry = unreadByUser.get(userId);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.fetchedAt >= STALE_MS) {
    return null;
  }
  return entry.count;
}

export function setCachedUnreadCount(userId: string, count: number): void {
  unreadByUser.set(userId, { count, fetchedAt: Date.now() });
}

export async function fetchCachedUnreadCount(userId: string, force = false): Promise<number> {
  if (!force) {
    const cached = getCachedUnreadCount(userId);
    if (cached != null) {
      return cached;
    }
  }

  const count = await getTotalUnreadCount(userId);
  setCachedUnreadCount(userId, count);
  return count;
}
