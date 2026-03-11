import { CONFIG } from '../../constants/config';
import { ActivityLocation } from '../../types/location';

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
}

/**
 * Search for sports locations using Google Places API
 */
export const searchSportsLocations = async (
  query: string,
  location?: { latitude: number; longitude: number },
  sportType?: string
): Promise<ActivityLocation[]> => {
  const apiKey = CONFIG.GOOGLE_PLACES_API_KEY_PLATFORM;
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  const searchQuery = sportType ? `${sportType} ${query}` : query;
  const locationParam = location
    ? `&location=${location.latitude},${location.longitude}&radius=5000`
    : '';

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    searchQuery
  )}${locationParam}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.results.map((place) => ({
      id: place.place_id,
      name: place.name,
      sport_type: sportType || 'Unknown',
      location: {
        type: 'Point' as const,
        coordinates: [place.geometry.location.lng, place.geometry.location.lat],
      },
      google_place_id: place.place_id,
      radius: 50, // default radius
      created_at: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error searching Google Places:', error);
    throw error;
  }
};

/**
 * Get place details from Google Places API
 */
export const getPlaceDetails = async (placeId: string): Promise<ActivityLocation | null> => {
  const apiKey = CONFIG.GOOGLE_PLACES_API_KEY_PLATFORM;
  if (!apiKey) {
    throw new Error('Google Places API key is not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;
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
    };
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
};
