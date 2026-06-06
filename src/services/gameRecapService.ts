import { Share } from 'react-native';
import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import { GameRecap } from '../types/gameRecap';
import { formatActivityTime } from '../utils/activityHelpers';

export const getGameRecap = async (recapId: string): Promise<GameRecap> => {
  const { data, error } = await supabase.rpc('get_game_recap', {
    p_recap_id: recapId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as GameRecap;
};

export const getGameRecapIdForActivity = async (activityId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('game_recaps')
    .select('id')
    .eq('activity_id', activityId)
    .maybeSingle();
  if (error || !data?.id) {
    return null;
  }
  return data.id as string;
};

export const formatRecapShareText = (recap: GameRecap): string => {
  const when = formatActivityTime(recap.start_time, recap.duration);
  const title = recap.group_name
    ? `${recap.group_name} · ${recap.sport_type}`
    : recap.sport_type;
  const court = recap.court_name ? `\n📍 ${recap.court_name}` : '';
  const attendees =
    recap.attendees.length > 0
      ? `\n👥 ${recap.attendees.map((a) => `@${a.username}`).join(', ')}`
      : '';
  const streak =
    recap.streak_highlight && recap.streak_highlight.week_streak > 0
      ? `\n🔥 @${recap.streak_highlight.username} — ${recap.streak_highlight.week_streak} week streak`
      : '';
  const rotations =
    recap.rotation_rounds && recap.rotation_rounds > 0
      ? `\n🎾 ${recap.rotation_rounds} rotation round(s)`
      : '';

  return `Rally recap — ${title}\n${when}${court}${attendees}${streak}${rotations}\n\nOrganized on Rally`;
};

export const shareGameRecap = async (recap: GameRecap): Promise<void> => {
  const message = formatRecapShareText(recap);
  await Share.share({ message });
  await trackProductEvent('recap_shared', {
    recap_id: recap.recap_id,
    activity_id: recap.activity_id,
  });
};
