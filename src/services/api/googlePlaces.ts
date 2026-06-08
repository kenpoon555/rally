import { CONFIG } from '../../constants/config';
import { ActivityLocation } from '../../types/location';
import {
  buildNearbyPlacesCacheKey,
  withGooglePlacesGuard,
} from './googlePlacesLimiter';

interface GooglePlaceResult {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface GooglePlacesResponse {
  results: GooglePlaceResult[];
  status: string;
  error_message?: string;
}

function placesApiError(status: string, errorMessage?: string): Error {
  if (status === 'REQUEST_DENIED') {
    return new Error(
      __DEV__
        ? 'Google Places API denied the request — enable Places API and check your API key restrictions.'
        : 'Court search is unavailable right now. Try again later.'
    );
  }
  if (status === 'OVER_QUERY_LIMIT') {
    return new Error('Court search daily limit reached. Try again tomorrow or pick a saved court.');
  }
  if (status === 'ZERO_RESULTS') {
    return new Error('No places found nearby — try a different search.');
  }
  return new Error(
    errorMessage ? `Google Places API error: ${status} (${errorMessage})` : `Google Places API error: ${status}`
  );
}

function mapPlaceResults(results: GooglePlaceResult[], sportType: string): ActivityLocation[] {
  return results.map((place) => ({
    id: place.place_id,
    name: place.name,
    sport_type: sportType,
    location: {
      type: 'Point' as const,
      coordinates: [place.geometry.location.lng, place.geometry.location.lat],
    },
    google_place_id: place.place_id,
    radius: 50,
    created_at: new Date().toISOString(),
  }));
}

async function runPlacesTextSearch(
  searchQuery: string,
  location?: { latitude: number; longitude: number },
  radiusMeters: number = CONFIG.COURT_SEARCH_WIDE_RADIUS_M
): Promise<GooglePlaceResult[]> {
  const apiKey = CONFIG.GOOGLE_PLACES_API_KEY_PLATFORM;
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  const cappedRadius = Math.min(radiusMeters, 50000);
  const locationParam = location
    ? `&location=${location.latitude},${location.longitude}&radius=${cappedRadius}`
    : '';

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    searchQuery
  )}${locationParam}&key=${apiKey}`;

  const response = await fetch(url);
  const data: GooglePlacesResponse = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw placesApiError(data.status, data.error_message);
  }

  return data.results ?? [];
}

/**
 * Search for sports locations using Google Places API (manual query).
 */
export const searchSportsLocations = async (
  query: string,
  location?: { latitude: number; longitude: number },
  sportType?: string,
  radiusMeters: number = CONFIG.COURT_SEARCH_WIDE_RADIUS_M
): Promise<ActivityLocation[]> => {
  const searchQuery = sportType ? `${sportType} ${query}` : query;
  const cacheKey = location
    ? `manual:${sportType ?? 'unknown'}:${query.trim().toLowerCase()}:${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
    : `manual:${sportType ?? 'unknown'}:${query.trim().toLowerCase()}`;

  const results = await withGooglePlacesGuard(
    cacheKey,
    () => runPlacesTextSearch(searchQuery, location, radiusMeters),
    { readCache: false, writeCache: false }
  );

  return mapPlaceResults(results, sportType || 'Unknown');
};

/**
 * Default nearby court discovery — one biased Text Search within ~25 miles.
 */
export const searchNearbySportsCourts = async (
  sportType: string,
  location: { latitude: number; longitude: number },
  radiusMeters: number = CONFIG.COURT_SEARCH_WIDE_RADIUS_M
): Promise<ActivityLocation[]> => {
  const cacheKey = buildNearbyPlacesCacheKey(sportType, location);

  const results = await withGooglePlacesGuard(cacheKey, () =>
    runPlacesTextSearch(`${sportType} court`, location, radiusMeters)
  );

  return mapPlaceResults(results.slice(0, 12), sportType);
};

/**
 * Get place details from Google Places API
 */
export const getPlaceDetails = async (placeId: string): Promise<ActivityLocation | null> => {
  const apiKey = CONFIG.GOOGLE_PLACES_API_KEY_PLATFORM;
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  const result = await withGooglePlacesGuard(
    `details:${placeId}`,
    async () => {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
        placeId
      )}&fields=place_id,name,geometry&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw placesApiError(data.status, data.error_message);
      }

      const place = data.result;
      if (!place?.geometry?.location) {
        return null;
      }

      return {
        id: place.place_id,
        name: place.name,
        sport_type: 'Unknown',
        location: {
          type: 'Point' as const,
          coordinates: [place.geometry.location.lng, place.geometry.location.lat],
        },
        google_place_id: place.place_id,
        radius: 50,
        created_at: new Date().toISOString(),
      } satisfies ActivityLocation;
    },
    { readCache: true, writeCache: true }
  );

  return result;
};
