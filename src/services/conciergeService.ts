import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';

export type ConciergeRequestRow = {
  id: string;
  user_id: string;
  username: string;
  sport: string;
  skill_level: string;
  area_note?: string | null;
  availability_note?: string | null;
  status: string;
  admin_note?: string | null;
  matched_activity_id?: string | null;
  matched_start_time?: string | null;
  matched_sport?: string | null;
  matched_location_name?: string | null;
  matched_host_username?: string | null;
  created_at: string;
};

export type ConciergeMatchGameRow = {
  id: string;
  sport_type: string;
  start_time: string;
  open_spots: number;
  listing_title?: string | null;
  location_name?: string | null;
  host_username: string;
};

export const submitConciergeRequest = async (params: {
  sport: string;
  skillLevel?: string;
  areaNote?: string;
  availabilityNote?: string;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('submit_concierge_request', {
    p_sport: params.sport,
    p_skill_level: params.skillLevel ?? 'open',
    p_area_note: params.areaNote?.trim() || null,
    p_availability_note: params.availabilityNote?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('concierge_request_submitted', { sport: params.sport });
  return data as string;
};

export const listPendingConciergeRequests = async (): Promise<ConciergeRequestRow[]> => {
  const { data, error } = await supabase.rpc('admin_list_concierge_requests', { p_limit: 50 });
  if (error) {
    throw new Error(error.message);
  }
  return (data as ConciergeRequestRow[] | null) ?? [];
};

export const updateConciergeRequest = async (
  requestId: string,
  status: 'pending' | 'matched' | 'closed',
  adminNote?: string,
  matchedActivityId?: string | null
): Promise<void> => {
  const { error } = await supabase.rpc('admin_update_concierge_request', {
    p_request_id: requestId,
    p_status: status,
    p_admin_note: adminNote ?? null,
    p_matched_activity_id: matchedActivityId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const searchConciergeMatchGames = async (
  sport: string,
  limit = 8
): Promise<ConciergeMatchGameRow[]> => {
  const { data, error } = await supabase.rpc('admin_search_match_games', {
    p_sport: sport,
    p_limit: limit,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as ConciergeMatchGameRow[] | null) ?? [];
};
