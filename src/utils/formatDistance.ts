const METERS_PER_MILE = 1609.344;
/** Urban driving heuristic (~28 mph average). */
const DRIVE_SPEED_MPS = (28 * METERS_PER_MILE) / 3600;

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

/** Straight-line distance with a simple drive-time estimate (no routing API). */
export function formatTravelEstimate(distanceMeters: number | null | undefined): string | null {
  if (distanceMeters == null || !Number.isFinite(distanceMeters)) {
    return null;
  }
  const miles = distanceMeters / METERS_PER_MILE;
  const minutes = Math.max(1, Math.round(distanceMeters / DRIVE_SPEED_MPS / 60));
  const mileLabel = miles < 0.1 ? '<0.1 mi' : `~${miles.toFixed(1)} mi`;
  return `${mileLabel} · ~${minutes} min drive`;
}

/** Court search radius for empty-state copy (e.g. "within 25 mi"). */
export function formatSearchRadiusLabel(radiusMeters: number): string {
  const miles = radiusMeters / METERS_PER_MILE;
  if (miles >= 10) {
    return `${Math.round(miles)} mi`;
  }
  return `~${miles.toFixed(1)} mi`;
}
