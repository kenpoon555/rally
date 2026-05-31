import { Platform } from 'react-native';
import type * as ExpoLocationType from 'expo-location';
import { Location } from '../types/location';
import { addLocationLog } from '../utils/devLocationLog';
import { CONFIG } from '../constants/config';
import { supabase } from './api/supabase';
import { ActivityLocation } from '../types/location';
import { normalizeActivityLocations } from '../utils/activityLocationGeo';
import { checkGeofences, locationToGeofence } from '../utils/geofence';

/** Bay Area test coords — used only in __DEV__ when simulator has no GPS fix. */
const DEV_LOCATION_FALLBACK: Location = {
  latitude: 37.33233141,
  longitude: -122.0312186,
  accuracy: 5000,
};

/** Lazy-load expo-location so globalThis.expo is set by native (avoids iOS "EventEmitter of undefined" crash). */
function getExpoLocation(): typeof ExpoLocationType {
  return require('expo-location');
}

async function getAndroidProviderStatus(
  ExpoLocation: typeof ExpoLocationType,
  reason: string
): Promise<ExpoLocationType.LocationProviderStatus | null> {
  if (Platform.OS !== 'android') {
    return null;
  }

  try {
    const status = await ExpoLocation.getProviderStatusAsync();

    if (__DEV__) {
      addLocationLog(
        `Android provider status (${reason}):`,
        JSON.stringify({
          locationServicesEnabled: status.locationServicesEnabled,
          gpsAvailable: status.gpsAvailable,
          networkAvailable: status.networkAvailable,
          passiveAvailable: status.passiveAvailable,
        })
      );

      if (!status.locationServicesEnabled) {
        addLocationLog('Android diagnosis: location services disabled');
      } else if (status.networkAvailable === false) {
        addLocationLog('Android diagnosis: network provider disabled (balanced accuracy may fail)');
      }
    }

    return status;
  } catch (error) {
    if (__DEV__) addLocationLog('Android provider status check failed:', String(error));
    return null;
  }
}

async function ensureAndroidNetworkProvider(
  ExpoLocation: typeof ExpoLocationType,
  providerStatus: ExpoLocationType.LocationProviderStatus | null
): Promise<ExpoLocationType.LocationProviderStatus | null> {
  if (Platform.OS !== 'android') {
    return providerStatus;
  }

  if (!providerStatus?.locationServicesEnabled || providerStatus.networkAvailable !== false) {
    return providerStatus;
  }

  if (__DEV__) addLocationLog('Android diagnosis: prompting enableNetworkProviderAsync...');

  try {
    await ExpoLocation.enableNetworkProviderAsync();
    if (__DEV__) addLocationLog('Android diagnosis: enableNetworkProviderAsync resolved');
  } catch (error) {
    if (__DEV__) addLocationLog('Android diagnosis: enableNetworkProviderAsync rejected:', String(error));
    return providerStatus;
  }

  return getAndroidProviderStatus(ExpoLocation, 'after network prompt');
}

type LocationSubscription = ExpoLocationType.LocationSubscription | { remove(): void };

let _watchIdCounter = 0;
const _subscriptions = new Map<number, LocationSubscription>();
const _cancelledBeforeReady = new Set<number>();

/**
 * Check current location permission without requesting (safe to call on app resume).
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const ExpoLocation = getExpoLocation();
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
    const ExpoLocation = getExpoLocation();
    const currentPermission = await ExpoLocation.getForegroundPermissionsAsync();
    if (currentPermission.status === ExpoLocation.PermissionStatus.GRANTED) {
      return true;
    }
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    const granted = status === ExpoLocation.PermissionStatus.GRANTED;
    return granted;
  } catch (error) {
    console.warn('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get current location (single attempt) using expo-location.
 * On Android emulator, getCurrentPositionAsync often fails even with mock location set.
 * We try getCurrentPositionAsync first, then fall back to getLastKnownPositionAsync.
 */
export async function getCurrentLocation(): Promise<Location> {
  const ExpoLocation = getExpoLocation();
  const hasPermission = await checkLocationPermission();
  if (!hasPermission) {
    throw new Error('Permission denied');
  }

  if (__DEV__) addLocationLog('getCurrentLocation called');

  let location: ExpoLocationType.LocationObject | null = null;
  let locationSource: 'current' | 'lastKnownConstrained' | 'lastKnownUnconstrained' = 'current';
  let providerStatus: ExpoLocationType.LocationProviderStatus | null = null;

  if (Platform.OS === 'android') {
    providerStatus = await getAndroidProviderStatus(ExpoLocation, 'before fetch');

    if (providerStatus && !providerStatus.locationServicesEnabled) {
      throw new Error('Android location services are disabled. Turn on location services and retry.');
    }

    providerStatus = await ensureAndroidNetworkProvider(ExpoLocation, providerStatus);
  }

  // Try getCurrentPositionAsync — on Android try low accuracy first (emulator-friendly).
  const accuracyOrder =
    Platform.OS === 'android'
      ? [
          ExpoLocation.Accuracy.Lowest,
          ExpoLocation.Accuracy.Low,
          ExpoLocation.Accuracy.Balanced,
        ]
      : [ExpoLocation.Accuracy.Balanced];

  for (const accuracy of accuracyOrder) {
    if (location) {
      break;
    }
    try {
      location = await ExpoLocation.getCurrentPositionAsync({ accuracy });
      if (location && __DEV__) {
        addLocationLog(`getCurrentPositionAsync ok (accuracy=${accuracy})`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (__DEV__) addLocationLog(`getCurrentPositionAsync failed (accuracy=${accuracy}):`, msg);
    }
  }

  if (!location) {
    if (__DEV__) addLocationLog('Trying getLastKnownPositionAsync fallback...');
    // Use a generous requiredAccuracy (10km) so network/wifi positions are accepted.
    // Emulators often report accuracy > 500m for non-GPS fixes, which caused the 500m
    // threshold to silently discard a valid cached position (e.g. from Google Maps).
    location = await ExpoLocation.getLastKnownPositionAsync({
      maxAge: 300000, // 5 minutes
      requiredAccuracy: 10000, // 10km – accept any realistically cached position
    });
    if (location) {
      locationSource = 'lastKnownConstrained';
    } else if (Platform.OS === 'android' && __DEV__) {
      addLocationLog('Android diagnosis: constrained fused lastLocation cache empty');
    }
  }

  // Last resort: no constraints at all (handles the case where maxAge/accuracy filtered everything out)
  if (!location) {
    if (__DEV__) addLocationLog('Trying getLastKnownPositionAsync with no constraints...');
    location = await ExpoLocation.getLastKnownPositionAsync({});
    if (location) {
      locationSource = 'lastKnownUnconstrained';
    } else if (Platform.OS === 'android' && __DEV__) {
      addLocationLog('Android diagnosis: unconstrained fused lastLocation cache empty');
    }
  }

  if (!location) {
    if (__DEV__) {
      addLocationLog(
        `${Platform.OS} dev fallback: using Bay Area test coords. Set mock location in simulator if needed.`
      );
      return { ...DEV_LOCATION_FALLBACK };
    }
    if (Platform.OS === 'android') {
      throw new Error(
        'Android location unavailable. Turn on location (High accuracy) or set a mock location in the emulator, then retry.'
      );
    }
    throw new Error('Location unavailable. Enable location services and set mock location if on emulator.');
  }

  const result: Location = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? undefined,
  };
  if (__DEV__) {
    addLocationLog(
      `getCurrentLocation success (${locationSource}):`,
      result.latitude.toFixed(4),
      result.longitude.toFixed(4)
    );
  }
  return result;
}

/**
 * Start location monitoring.
 * On Android and iOS we avoid watchPositionAsync (EventEmitter path) and use getCurrentPositionAsync
 * polling instead, so native EventEmitter is never used for location and startup/race issues are avoided.
 */
export const startLocationMonitoring = (
  onLocationUpdate: (location: Location) => void,
  onError: (error: Error) => void
): number => {
  const watchId = ++_watchIdCounter;

  const pollOnce = async () => {
    try {
      const loc = await getCurrentLocation();
      onLocationUpdate(loc);
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    const ExpoLocation = getExpoLocation();
    ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.Balanced,
        timeInterval: CONFIG.LOCATION_UPDATE_INTERVAL,
        distanceInterval: CONFIG.LOCATION_DISTANCE_FILTER,
      },
      (position) => {
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
  }

  // Android & iOS: polling with getCurrentPositionAsync (no EventEmitter)
  pollOnce();
  const intervalId = setInterval(pollOnce, CONFIG.LOCATION_UPDATE_INTERVAL);
  const subscription: LocationSubscription = {
    remove() {
      clearInterval(intervalId);
    },
  };
  if (_cancelledBeforeReady.has(watchId)) {
    subscription.remove();
    _cancelledBeforeReady.delete(watchId);
  } else {
    _subscriptions.set(watchId, subscription);
  }
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
    const filtered = allLocations.filter((loc: ActivityLocation) => {
      if (!loc.location?.coordinates) return false;
      const [lng, lat] = loc.location.coordinates;
      const distance = Math.sqrt(
        Math.pow(lat - latitude, 2) + Math.pow(lng - longitude, 2)
      );
      return distance * 111000 <= radius; // Rough conversion to meters
    }) as ActivityLocation[];
    return normalizeActivityLocations(filtered);
  }

  return normalizeActivityLocations((data || []) as ActivityLocation[]);
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

  return normalizeActivityLocations((data || []) as ActivityLocation[]);
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
