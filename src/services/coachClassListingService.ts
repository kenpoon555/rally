import { supabase } from './api/supabase';
import { COACH_DASHBOARD } from '../constants/coachParentFlags';
import { CoachClassListing } from '../types/coachParent';
import { SportType } from '../constants/sports';

type ListingRow = {
  id: string;
  coach_user_id: string;
  title: string;
  sport_type: string;
  location_name: string;
  start_time: string;
  duration_minutes: number;
  enrolled_count: number;
  confirmed_count: number;
  fee_note: string | null;
};

function mapListing(row: ListingRow): CoachClassListing {
  return {
    id: row.id,
    coach_user_id: row.coach_user_id,
    title: row.title,
    sport_type: row.sport_type as SportType,
    location_name: row.location_name,
    start_time: row.start_time,
    duration_minutes: row.duration_minutes,
    enrolled_count: row.enrolled_count,
    confirmed_count: row.confirmed_count,
    fee_note: row.fee_note ?? undefined,
  };
}

function newClassId(): string {
  return `class-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createCoachClassListing(params: {
  coachUserId: string;
  title: string;
  sportType: SportType;
  locationName: string;
  startTime: string;
  durationMinutes: number;
  feeNote?: string | null;
}): Promise<CoachClassListing> {
  if (!COACH_DASHBOARD) {
    throw new Error('Coach classes are not enabled in this build.');
  }

  const id = newClassId();
  const { data, error } = await supabase
    .from('coach_class_listings')
    .insert({
      id,
      coach_user_id: params.coachUserId,
      title: params.title.trim(),
      sport_type: params.sportType,
      location_name: params.locationName.trim(),
      start_time: params.startTime,
      duration_minutes: params.durationMinutes,
      enrolled_count: 0,
      confirmed_count: 0,
      fee_note: params.feeNote?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Could not publish class.');
  }

  return mapListing(data as ListingRow);
}

export async function listCoachClassListingsFromDb(
  coachUserId: string
): Promise<CoachClassListing[]> {
  const { data, error } = await supabase
    .from('coach_class_listings')
    .select('*')
    .eq('coach_user_id', coachUserId)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => mapListing(row as ListingRow));
}

export async function getCoachClassListingFromDb(
  classId: string
): Promise<CoachClassListing | null> {
  const { data, error } = await supabase
    .from('coach_class_listings')
    .select('*')
    .eq('id', classId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapListing(data as ListingRow) : null;
}
