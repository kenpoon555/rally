import { NativeModules, Platform } from 'react-native';
import RuntimeConfig from 'react-native-config';

const asNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readEnv = (key: string): string => {
  const nativeConfigModule = (NativeModules as Record<string, Record<string, unknown>>)
    .RNCConfigModule;
  const candidates: Array<Record<string, unknown> | undefined> = [
    RuntimeConfig as unknown as Record<string, unknown>,
    (RuntimeConfig as unknown as { default?: Record<string, unknown> }).default,
    nativeConfigModule,
  ];

  for (const candidate of candidates) {
    const value = candidate?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
};

export const CONFIG = {
  // Supabase anon key is public by design, but still loaded from env so credentials
  // are not committed in source code.
  SUPABASE_URL: readEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: readEnv('SUPABASE_ANON_KEY'),

  // Support one shared key or platform-specific keys.
  GOOGLE_PLACES_API_KEY_IOS: readEnv('GOOGLE_PLACES_API_KEY_IOS'),
  GOOGLE_PLACES_API_KEY_ANDROID: readEnv('GOOGLE_PLACES_API_KEY_ANDROID'),
  GOOGLE_PLACES_API_KEY: readEnv('GOOGLE_PLACES_API_KEY'),

  /** Court search on Create Game — first pass (meters). */
  NEARBY_COURT_RADIUS_M: 5000,
  /** Court search when none within NEARBY_COURT_RADIUS_M (meters). */
  WIDER_COURT_RADIUS_M: 25000,
  /** Niche sports (squash, ultimate, etc.) — search wider metro area on Create Game. */
  NICHE_COURT_RADIUS_M: 60000,
  /** Last resort court search for rare sports (meters). */
  MAX_COURT_RADIUS_M: 120000,
  /** Discover feed radius (meters). LA beta — wide enough to cover the metro from one GPS fix. */
  DISCOVERY_RADIUS_M: 60000,
  /** Cap rows fetched before client-side geo filter (Play tab). */
  DISCOVER_QUERY_LIMIT: 120,
  /** Wider radius for games a friend hosts or joined (meters). */
  FRIEND_DISCOVERY_RADIUS_M: 120000,

  get GOOGLE_PLACES_API_KEY_PLATFORM() {
    if (Platform.OS === 'ios' && this.GOOGLE_PLACES_API_KEY_IOS) {
      return this.GOOGLE_PLACES_API_KEY_IOS;
    }
    if (Platform.OS === 'android' && this.GOOGLE_PLACES_API_KEY_ANDROID) {
      return this.GOOGLE_PLACES_API_KEY_ANDROID;
    }
    return this.GOOGLE_PLACES_API_KEY;
  },

  GEOFENCE_RADIUS: asNumber(readEnv('GEOFENCE_RADIUS'), 50),
  LOCATION_UPDATE_INTERVAL: asNumber(readEnv('LOCATION_UPDATE_INTERVAL'), 10000),
  LOCATION_DISTANCE_FILTER: asNumber(readEnv('LOCATION_DISTANCE_FILTER'), 50),

  /** Optional crash/error reporting (set `SENTRY_DSN` via react-native-config / EAS secrets). */
  SENTRY_DSN: readEnv('SENTRY_DSN'),
};
