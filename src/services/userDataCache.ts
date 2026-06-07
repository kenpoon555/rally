import { getMyGames, MyGamesResult } from './activityService';
import { getMyRegularGroups } from './regularGroupService';
import { RegularGroup } from '../types/regularGroup';

/** Shared stale-while-revalidate window for games + rallies across tabs. */
export const USER_DATA_CACHE_STALE_MS = 30_000;

type CacheEntry<T> = {
  data: T | null;
  fetchedAt: number;
  inflight: Promise<T> | null;
};

const gamesByUser = new Map<string, CacheEntry<MyGamesResult>>();
const groupsByUser = new Map<string, CacheEntry<RegularGroup[]>>();
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeUserDataCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getEntry<T>(map: Map<string, CacheEntry<T>>, userId: string): CacheEntry<T> {
  let entry = map.get(userId);
  if (!entry) {
    entry = { data: null, fetchedAt: 0, inflight: null };
    map.set(userId, entry);
  }
  return entry;
}

async function fetchWithDedupe<T>(
  map: Map<string, CacheEntry<T>>,
  userId: string,
  fetcher: () => Promise<T>,
  force: boolean
): Promise<T> {
  const entry = getEntry(map, userId);
  const now = Date.now();

  if (!force && entry.data != null && now - entry.fetchedAt < USER_DATA_CACHE_STALE_MS) {
    return entry.data;
  }

  if (entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = fetcher()
    .then((data) => {
      entry.data = data;
      entry.fetchedAt = Date.now();
      entry.inflight = null;
      notifyListeners();
      return data;
    })
    .catch((error) => {
      entry.inflight = null;
      throw error;
    });

  return entry.inflight;
}

export function getCachedMyGamesSnapshot(userId: string): MyGamesResult | null {
  return gamesByUser.get(userId)?.data ?? null;
}

export function getCachedMyRegularGroupsSnapshot(userId: string): RegularGroup[] | null {
  return groupsByUser.get(userId)?.data ?? null;
}

export function isMyGamesCacheFresh(userId: string): boolean {
  const entry = gamesByUser.get(userId);
  if (!entry?.data) {
    return false;
  }
  return Date.now() - entry.fetchedAt < USER_DATA_CACHE_STALE_MS;
}

export function isMyRegularGroupsCacheFresh(userId: string): boolean {
  const entry = groupsByUser.get(userId);
  if (!entry?.data) {
    return false;
  }
  return Date.now() - entry.fetchedAt < USER_DATA_CACHE_STALE_MS;
}

export function fetchCachedMyGames(userId: string, force = false): Promise<MyGamesResult> {
  return fetchWithDedupe(gamesByUser, userId, () => getMyGames(userId), force);
}

export function fetchCachedMyRegularGroups(
  userId: string,
  force = false
): Promise<RegularGroup[]> {
  return fetchWithDedupe(groupsByUser, userId, () => getMyRegularGroups(userId), force);
}

export function invalidateUserDataCache(userId?: string): void {
  if (userId) {
    gamesByUser.delete(userId);
    groupsByUser.delete(userId);
  } else {
    gamesByUser.clear();
    groupsByUser.clear();
  }
  notifyListeners();
}
