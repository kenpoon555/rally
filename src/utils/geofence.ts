import { Geofence } from '../types/location';
import { Location } from '../types/location';
import { calculateDistance } from './distance';

/**
 * Check if a location is within any of the provided geofences
 */
export const checkGeofences = (
  userLocation: Location,
  geofences: Geofence[]
): Geofence | null => {
  for (const geofence of geofences) {
    const distance = calculateDistance(userLocation, geofence.center);
    if (distance <= geofence.radius) {
      return geofence;
    }
  }
  return null;
};

/**
 * Convert ActivityLocation to Geofence format
 */
export const locationToGeofence = (location: {
  id: string;
  location: { type: 'Point'; coordinates: [number, number] };
  sport_type: string;
  radius: number;
}): Geofence => {
  return {
    id: location.id,
    center: {
      latitude: location.location.coordinates[1],
      longitude: location.location.coordinates[0],
    },
    radius: location.radius,
    sport_type: location.sport_type,
  };
};
