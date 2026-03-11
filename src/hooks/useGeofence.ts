import { useEffect, useRef, useCallback } from 'react';
import { Location, ActivityLocation } from '../types/location';
import { checkUserAtSportsLocation } from '../services/locationService';

interface UseGeofenceOptions {
  onLocationDetected: (location: ActivityLocation) => void;
  enabled?: boolean;
  checkInterval?: number;
}

export const useGeofence = (
  userLocation: Location | null,
  options: UseGeofenceOptions
) => {
  const { onLocationDetected, enabled = true, checkInterval = 30000 } = options;
  const lastCheckedRef = useRef<number>(0);
  const lastDetectedLocationRef = useRef<string | null>(null);
  const onLocationDetectedRef = useRef(onLocationDetected);
  const userLocationRef = useRef(userLocation);
  onLocationDetectedRef.current = onLocationDetected;
  userLocationRef.current = userLocation;

  const checkGeofence = useCallback(async () => {
    const loc = userLocationRef.current;
    if (!loc || !enabled) return;

    const now = Date.now();
    if (now - lastCheckedRef.current < checkInterval) return;

    lastCheckedRef.current = now;

    try {
      const detectedLocation = await checkUserAtSportsLocation(loc);
      if (
        detectedLocation &&
        detectedLocation.id !== lastDetectedLocationRef.current
      ) {
        lastDetectedLocationRef.current = detectedLocation.id;
        onLocationDetectedRef.current(detectedLocation);
      }
    } catch (error) {
      console.error('Error checking geofence:', error);
    }
  }, [enabled, checkInterval]);

  const lat = userLocation?.latitude;
  const lng = userLocation?.longitude;

  useEffect(() => {
    if (lat == null || lng == null || !enabled) return;

    checkGeofence();

    const interval = setInterval(() => {
      checkGeofence();
    }, checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [lat, lng, enabled, checkInterval, checkGeofence]);

  return {
    checkGeofence,
  };
};
