import { SportType } from '../constants/sports';
import { ActivityLocation } from '../types/location';
import { searchNearbySportsCourts, searchSportsLocations } from './api/googlePlaces';
import { saveActivityLocation } from './locationService';
import { supabase } from './api/supabase';

export type CourtReportType = 'closed' | 'wrong_sport' | 'wrong_location' | 'duplicate' | 'other';

export async function reportCourtIssue(
  locationId: string,
  reportType: CourtReportType,
  note?: string
): Promise<void> {
  const { error } = await supabase.rpc('report_court_issue', {
    p_location_id: locationId,
    p_report_type: reportType,
    p_note: note?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
}

/** Search Google Places and persist a new active court row for this sport. */
export async function addCourtFromPlacesSearch(
  query: string,
  sportType: SportType,
  near?: { latitude: number; longitude: number }
): Promise<ActivityLocation> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error('Enter a court or park name to search.');
  }

  const results = await searchSportsLocations(trimmed, near, sportType);
  if (results.length === 0) {
    throw new Error('No places found — try a park name, recreation center, or address.');
  }

  return addCourtFromPlacePreview(results[0], sportType);
}

/** Nearby courts from Google (~25 mi), not yet saved to Supabase. */
export async function discoverNearbyCourtsFromPlaces(
  sportType: SportType,
  near: { latitude: number; longitude: number }
): Promise<ActivityLocation[]> {
  return searchNearbySportsCourts(sportType, near);
}

/** Persist a Places preview row and return the saved court. */
export async function addCourtFromPlacePreview(
  place: ActivityLocation,
  sportType: SportType
): Promise<ActivityLocation> {
  return saveActivityLocation({
    name: place.name,
    sport_type: sportType,
    location: place.location,
    google_place_id: place.google_place_id,
    radius: place.radius,
    source: 'places',
    is_active: true,
    last_verified_at: new Date().toISOString(),
  });
}
