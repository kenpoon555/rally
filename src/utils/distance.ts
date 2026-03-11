/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First point with latitude and longitude
 * @param point2 Second point with latitude and longitude
 * @returns Distance in meters
 */
export const calculateDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if a point is within a radius of another point
 */
export const isWithinRadius = (
  point: { latitude: number; longitude: number },
  center: { latitude: number; longitude: number },
  radius: number
): boolean => {
  const distance = calculateDistance(point, center);
  return distance <= radius;
};
