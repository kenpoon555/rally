import { supabase } from './api/supabase';
import { RallyLeaderboardEntry, RallyLeaderboardWindow } from '../types/rallyLeaderboard';

export const getRallyLeaderboard = async (
  groupId: string,
  window: RallyLeaderboardWindow = 'all'
): Promise<RallyLeaderboardEntry[]> => {
  const { data, error } = await supabase.rpc('get_rally_leaderboard', {
    p_group_id: groupId,
    p_window_days: window === '90' ? 90 : null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as RallyLeaderboardEntry[];
};
