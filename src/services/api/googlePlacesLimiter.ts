import { CONFIG } from '../../constants/config';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const nearbyCache = new Map<string, CacheEntry<unknown>>();
let lastRequestAt = 0;
let sessionRequestCount = 0;

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildNearbyPlacesCacheKey(
  sportType: string,
  location: { latitude: number; longitude: number }
): string {
  return `${sportType.toLowerCase()}:${roundCoord(location.latitude)}:${roundCoord(location.longitude)}`;
}

export function getCachedPlacesResult<T>(cacheKey: string): T | null {
  const entry = nearbyCache.get(cacheKey) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    nearbyCache.delete(cacheKey);
    return null;
  }
  return entry.value;
}

export function setCachedPlacesResult<T>(cacheKey: string, value: T): void {
  nearbyCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + CONFIG.GOOGLE_PLACES_CACHE_TTL_MS,
  });
}

export function clearPlacesSessionCache(): void {
  nearbyCache.clear();
}

/** Guard Places HTTP calls — spacing, session cap, optional response cache. */
export async function withGooglePlacesGuard<T>(
  cacheKey: string | null,
  run: () => Promise<T>,
  options?: { readCache?: boolean; writeCache?: boolean }
): Promise<T> {
  const readCache = options?.readCache ?? cacheKey != null;
  const writeCache = options?.writeCache ?? cacheKey != null;

  if (readCache && cacheKey) {
    const cached = getCachedPlacesResult<T>(cacheKey);
    if (cached != null) {
      return cached;
    }
  }

  if (sessionRequestCount >= CONFIG.GOOGLE_PLACES_SESSION_MAX_REQUESTS) {
    throw new Error('Court search limit reached for this session. Try again later.');
  }

  const elapsed = Date.now() - lastRequestAt;
  if (lastRequestAt > 0 && elapsed < CONFIG.GOOGLE_PLACES_MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, CONFIG.GOOGLE_PLACES_MIN_INTERVAL_MS - elapsed)
    );
  }

  sessionRequestCount += 1;
  lastRequestAt = Date.now();

  const result = await run();

  if (writeCache && cacheKey) {
    setCachedPlacesResult(cacheKey, result);
  }

  return result;
}
