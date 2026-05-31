/** Bucket distance for pre-confirmation privacy (meters). */
export const DISTANCE_BUCKET_METERS = 250;

/** Offset map pins by ~150–350 m using a stable seed (activity id). */
export function fuzzMapCoordinate(
  latitude: number,
  longitude: number,
  seed: string
): { latitude: number; longitude: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const angle = ((hash % 360) * Math.PI) / 180;
  const offsetMeters = 150 + (Math.abs(hash) % 200);
  const dLat = (offsetMeters / 111000) * Math.cos(angle);
  const dLng = (offsetMeters / (111000 * Math.cos((latitude * Math.PI) / 180))) * Math.sin(angle);
  return {
    latitude: latitude + dLat,
    longitude: longitude + dLng,
  };
}

export function bucketDistanceMeters(meters: number): number {
  return Math.max(DISTANCE_BUCKET_METERS, Math.round(meters / DISTANCE_BUCKET_METERS) * DISTANCE_BUCKET_METERS);
}

export function formatApproximateDistance(meters: number): string {
  const bucketed = bucketDistanceMeters(meters);
  if (bucketed < 1000) {
    return `~${bucketed} m away`;
  }
  return `~${(bucketed / 1000).toFixed(1)} km away`;
}
