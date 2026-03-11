import { supabase } from './api/supabase';
import {
  Activity,
  ActivityCandidateLocation,
  ActivityParticipantPreference,
  FinalizedActivityResult,
  JoinRequest,
} from '../types/activity';
import { SportType, ActivityVisibility } from '../constants/sports';

/**
 * Create a new activity
 */
export const createActivity = async (activityData: {
  user_id: string;
  location_id?: string | null;
  sport_type: SportType;
  start_time: string;
  duration: number;
  visibility: ActivityVisibility;
  missing_players?: number;
  scheduling_mode?: 'fixed' | 'flex';
  preference_deadline?: string;
  window_start?: string;
  window_end?: string;
  match_status?: 'open' | 'collecting' | 'finalized' | 'cancelled';
  candidate_location_ids?: string[];
}): Promise<Activity> => {
  const { candidate_location_ids, ...basePayload } = activityData;

  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...basePayload,
      player_count: 1,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create activity: ${error.message}`);
  }

  const createdActivity = data as Activity;

  if (candidate_location_ids?.length) {
    const candidateRows = candidate_location_ids.slice(0, 3).map((locationId, index) => ({
      activity_id: createdActivity.id,
      location_id: locationId,
      priority_order: index + 1,
    }));

    const { error: candidateError } = await supabase
      .from('activity_candidate_locations')
      .insert(candidateRows);

    if (candidateError) {
      throw new Error(`Activity created but candidate locations failed: ${candidateError.message}`);
    }
  }

  return createdActivity;
};

/**
 * Get activity by ID with related data
 */
export const getActivityById = async (activityId: string): Promise<Activity | null> => {
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(*),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url),
      candidate_locations:activity_candidate_locations(
        id,
        activity_id,
        location_id,
        priority_order,
        created_at,
        location:activity_locations(*)
      )
    `
    )
    .eq('id', activityId)
    .single();

  if (error) {
    console.error('Error fetching activity:', error);
    return null;
  }

  return data as Activity;
};

/**
 * Get nearby activities
 */
export const getNearbyActivities = async (
  latitude: number,
  longitude: number,
  radius: number = 5000, // 5km default
  sportType?: SportType
): Promise<Activity[]> => {
  let query = supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(*),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('status', 'active')
    .gte('start_time', new Date().toISOString());

  if (sportType) {
    query = query.eq('sport_type', sportType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching nearby activities:', error);
    return [];
  }

  // Filter by distance (PostGIS would be better, but this works for MVP)
  const activities = (data || []) as Activity[];
  return activities.filter((activity) => {
    if (!activity.location?.location?.coordinates) return false;
    const [lng, lat] = activity.location.location.coordinates;
    const distance = Math.sqrt(
      Math.pow(lat - latitude, 2) + Math.pow(lng - longitude, 2)
    );
    return distance * 111000 <= radius; // Rough conversion to meters
  });
};

/**
 * Get user's activities
 */
export const getUserActivities = async (userId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(*),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }

  return (data || []) as Activity[];
};

/**
 * Update activity
 */
export const updateActivity = async (
  activityId: string,
  updates: Partial<Activity>
): Promise<Activity> => {
  const { data, error } = await supabase
    .from('activities')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update activity: ${error.message}`);
  }

  return data as Activity;
};

/**
 * Create join request
 */
export const createJoinRequest = async (
  activityId: string,
  userId: string
): Promise<JoinRequest> => {
  // Check if request already exists
  const { data: existing } = await supabase
    .from('join_requests')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing as JoinRequest;
  }

  const { data, error } = await supabase
    .from('join_requests')
    .insert({
      activity_id: activityId,
      user_id: userId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create join request: ${error.message}`);
  }

  return data as JoinRequest;
};

/**
 * Approve join request
 */
export const approveJoinRequest = async (
  requestId: string,
  activityId: string
): Promise<void> => {
  // Update request status
  const { error: requestError } = await supabase
    .from('join_requests')
    .update({
      status: 'approved',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (requestError) {
    throw new Error(`Failed to approve join request: ${requestError.message}`);
  }

  // Increment player count
  const { data: activity } = await supabase
    .from('activities')
    .select('player_count')
    .eq('id', activityId)
    .single();

  if (activity) {
    await supabase
      .from('activities')
      .update({
        player_count: (activity.player_count || 1) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activityId);
  }
};

/**
 * Reject join request
 */
export const rejectJoinRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('join_requests')
    .update({
      status: 'rejected',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw new Error(`Failed to reject join request: ${error.message}`);
  }
};

/**
 * Get join requests for an activity
 */
export const getActivityJoinRequests = async (
  activityId: string
): Promise<JoinRequest[]> => {
  const { data, error } = await supabase
    .from('join_requests')
    .select(
      `
      *,
      user:profiles!join_requests_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('activity_id', activityId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }

  return (data || []) as JoinRequest[];
};

/**
 * Upsert participant preference for flexible matching.
 */
export const upsertParticipantPreference = async (
  activityId: string,
  userId: string,
  preference: {
    earliest_start?: string | null;
    latest_start?: string | null;
    preferred_duration?: number | null;
    preferred_location_id?: string | null;
    availability_weight?: number;
    notes?: string | null;
  }
): Promise<ActivityParticipantPreference> => {
  const payload = {
    activity_id: activityId,
    user_id: userId,
    earliest_start: preference.earliest_start ?? null,
    latest_start: preference.latest_start ?? null,
    preferred_duration: preference.preferred_duration ?? null,
    preferred_location_id: preference.preferred_location_id ?? null,
    availability_weight: preference.availability_weight ?? 3,
    notes: preference.notes ?? null,
  };

  const { data, error } = await supabase
    .from('activity_participant_preferences')
    .upsert(payload, {
      onConflict: 'activity_id,user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit preference: ${error.message}`);
  }

  return data as ActivityParticipantPreference;
};

/**
 * Get all submitted participant preferences for an activity.
 */
export const getActivityParticipantPreferences = async (
  activityId: string
): Promise<ActivityParticipantPreference[]> => {
  const { data, error } = await supabase
    .from('activity_participant_preferences')
    .select('*')
    .eq('activity_id', activityId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch preferences: ${error.message}`);
  }

  return (data || []) as ActivityParticipantPreference[];
};

/**
 * Host finalizes best matching slot via RPC.
 */
export const finalizeFlexibleActivity = async (
  activityId: string,
  fallbackLocationId?: string
): Promise<FinalizedActivityResult> => {
  const { data, error } = await supabase.rpc('finalize_activity_best_slot', {
    target_activity_id: activityId,
    fallback_location_id: fallbackLocationId || null,
  });

  if (error) {
    throw new Error(`Failed to finalize activity: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error('Finalization returned no result.');
  }

  return result as FinalizedActivityResult;
};

/**
 * Get candidate locations for an activity.
 */
export const getActivityCandidateLocations = async (
  activityId: string
): Promise<ActivityCandidateLocation[]> => {
  const { data, error } = await supabase
    .from('activity_candidate_locations')
    .select(
      `
      id,
      activity_id,
      location_id,
      priority_order,
      created_at,
      location:activity_locations(*)
    `
    )
    .eq('activity_id', activityId)
    .order('priority_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch candidate locations: ${error.message}`);
  }

  return (data || []) as ActivityCandidateLocation[];
};
