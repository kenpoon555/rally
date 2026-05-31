/**
 * Human-readable distance label for court/game lists.
 */
export function formatDistanceLabel(distanceMeters: number | null | undefined): string {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return 'Distance unknown';
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m away`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km away`;
}
