import { supabase } from './api/supabase';

export type AdminPublicGameRow = {
  id: string;
  sport_type: string;
  start_time: string;
  open_spots: number;
  listing_title?: string | null;
  is_intro_session: boolean;
  location_name?: string | null;
  host_username: string;
};

export const listPublicGamesForIntroAdmin = async (
  limit = 20
): Promise<AdminPublicGameRow[]> => {
  const { data, error } = await supabase.rpc('admin_list_public_games_for_intro', {
    p_limit: limit,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as AdminPublicGameRow[] | null) ?? [];
};

export const setIntroSessionAdmin = async (
  activityId: string,
  isIntro: boolean
): Promise<void> => {
  const { error } = await supabase.rpc('admin_set_intro_session', {
    p_activity_id: activityId,
    p_is_intro: isIntro,
  });
  if (error) {
    throw new Error(error.message);
  }
};
