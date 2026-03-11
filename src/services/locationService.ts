import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';
import { Location } from '../types/location';
import { sendDebugLog } from '../utils/debugIngest';
import { addLocationLog } from '../utils/devLocationLog';

const DEBUG_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const DEBUG_INGEST_URL = `http://${DEBUG_HOST}:7244/ingest/6b58671e-eb23-45d8-a6fe-a7768139a3fc`;
function agentLog(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  fetch(DEBUG_INGEST_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a6a971' }, body: JSON.stringify({ sessionId: 'a6a971', location, message, data, timestamp: Date.now(), hypothesisId }) }).catch(() => {});
}
import { CONFIG } from '../constants/config';
import { supabase } from './api/supabase';
import { ActivityLocation } from '../types/location';
import { checkGeofences, locationToGeofence } from '../utils/geofence';

let _watchIdCounter = 0;
const _subscriptions = new Map<number, ExpoLocation.LocationSubscription>();
const _cancelledBeforeReady = new Set<number>();

/**
 * Check current location permission without requesting (safe to call on app resume).
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    const granted = status === ExpoLocation.PermissionStatus.GRANTED;
    if (__DEV__) addLocationLog('location permission:', status, granted ? '(granted)' : '');
    return granted;
  } catch (error) {
    if (__DEV__) addLocationLog('checkLocationPermission error:', String(error));
    return false;
  }
};

/**
 * Request location permission (checks first; requests only if not granted).
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    sendDebugLog('locationService.ts:requestPermission', 'Requesting foreground location', {}, 'H3');
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    const granted = status === ExpoLocation.PermissionStatus.GRANTED;
    sendDebugLog('locationService.ts:permissionResult', 'requestForegroundPermissionsAsync returned', { status }, 'H8');
    return granted;
  } catch (error) {
    console.warn('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location (single attempt) using expo-location.
 */
export async function getCurrentLocation(): Promise<Location> {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  if (status !== ExpoLocation.PermissionStatus.GRANTED) {
    throw new Error('Permission denied');
  }

  if (__DEV__) addLocationLog('getCurrentLocation called');
  sendDebugLog('locationService.ts:getCurrentLocation', 'getCurrentPositionAsync called', {}, 'H8');
  agentLog('locationService.ts:getCurrentPosition:entry', 'getCurrentPositionAsync called', {}, 'H1,H2,H4');

  const location = await ExpoLocation.getCurrentPositionAsync({
    accuracy: ExpoLocation.Accuracy.Balanced,
  });

  const result: Location = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
  };
  if (__DEV__) addLocationLog('getCurrentPosition success:', result.latitude.toFixed(4), result.longitude.toFixed(4));
  agentLog('locationService.ts:getCurrentPosition:success', 'success', { lat: result.latitude, lng: result.longitude }, 'H1');
  return result;
}

/**
 * Start location monitoring (expo-location watchPositionAsync).
 */
export const startLocationMonitoring = (
  onLocationUpdate: (location: Location) => void,
  onError: (error: Error) => void
): number => {
  const watchId = ++_watchIdCounter;
  sendDebugLog('locationService.ts:watchPosition', 'watchPositionAsync called', {}, 'H3,H5');
  let firstUpdateLogged = false;

  ExpoLocation.watchPositionAsync(
    {
      accuracy: ExpoLocation.Accuracy.Balanced,
      timeInterval: CONFIG.LOCATION_UPDATE_INTERVAL,
      distanceInterval: CONFIG.LOCATION_DISTANCE_FILTER,
    },
    (position) => {
      if (!firstUpdateLogged) {
        firstUpdateLogged = true;
        sendDebugLog('locationService.ts:firstLocationUpdate', 'First watchPosition update received', {}, 'H5');
      }
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
      });
    }
  ).then((subscription) => {
    if (_cancelledBeforeReady.has(watchId)) {
      subscription.remove();
      _cancelledBeforeReady.delete(watchId);
    } else {
      _subscriptions.set(watchId, subscription);
    }
  }).catch((err) => {
    onError(err instanceof Error ? err : new Error(String(err)));
  });

  return watchId;
};

/**
 * Stop location monitoring
 */
export const stopLocationMonitoring = (watchId: number): void => {
  if (watchId < 0) return;
  const sub = _subscriptions.get(watchId);
  if (sub) {
    sub.remove();
    _subscriptions.delete(watchId);
  } else {
    _cancelledBeforeReady.add(watchId);
  }
};

/**
 * Get nearby activity locations from Supabase
 */
export const getNearbyActivityLocations = async (
  latitude: number,
  longitude: number,
  radius: number = 1000 // 1km default
): Promise<ActivityLocation[]> => {
  // Using PostGIS ST_DWithin for efficient geospatial query
  const { data, error } = await supabase.rpc('get_nearby_locations', {
    user_lat: latitude,
    user_lng: longitude,
    radius_meters: radius,
  });

  if (error) {
    // Fallback to client-side filtering if RPC doesn't exist
    const { data: allLocations } = await supabase
      .from('activity_locations')
      .select('*');

    if (!allLocations) return [];

    // Simple distance filtering (PostGIS would be better)
    return allLocations.filter((loc: ActivityLocation) => {
      if (!loc.location?.coordinates) return false;
      const [lng, lat] = loc.location.coordinates;
      const distance = Math.sqrt(
        Math.pow(lat - latitude, 2) + Math.pow(lng - longitude, 2)
      );
      return distance * 111000 <= radius; // Rough conversion to meters
    }) as ActivityLocation[];
  }

  return (data || []) as ActivityLocation[];
};

/**
 * Get all activity locations for fallback UI flows.
 */
export const getAllActivityLocations = async (
  limit: number = 300
): Promise<ActivityLocation[]> => {
  const { data, error } = await supabase
    .from('activity_locations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load activity locations: ${error.message}`);
  }

  return (data || []) as ActivityLocation[];
};

/**
 * Check if user is at a sports location (geofence check)
 */
export const checkUserAtSportsLocation = async (
  userLocation: Location
): Promise<ActivityLocation | null> => {
  try {
    const nearbyLocations = await getNearbyActivityLocations(
      userLocation.latitude,
      userLocation.longitude,
      CONFIG.GEOFENCE_RADIUS * 2 // Check within 2x radius
    );

    const geofences = nearbyLocations.map(locationToGeofence);
    const matchedGeofence = checkGeofences(userLocation, geofences);

    if (matchedGeofence) {
      return (
        nearbyLocations.find((loc) => loc.id === matchedGeofence.id) || null
      );
    }

    return null;
  } catch (error) {
    console.error('Error checking sports location:', error);
    return null;
  }
};

/**
 * Create or update activity location
 */
export const saveActivityLocation = async (
  location: Omit<ActivityLocation, 'id' | 'created_at'>
): Promise<ActivityLocation> => {
  // Check if location with same google_place_id exists
  if (location.google_place_id) {
    const { data: existing } = await supabase
      .from('activity_locations')
      .select('*')
      .eq('google_place_id', location.google_place_id)
      .single();

    if (existing) {
      return existing as ActivityLocation;
    }
  }

  const { data, error } = await supabase
    .from('activity_locations')
    .insert({
      ...location,
      location: {
        type: 'Point',
        coordinates: location.location.coordinates,
      },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save activity location: ${error.message}`);
  }

  return data as ActivityLocation;
};
