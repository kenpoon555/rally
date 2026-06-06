import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import { SessionRotationState } from '../types/sessionRotation';

export const getSessionRotationState = async (
  activityId: string
): Promise<SessionRotationState> => {
  const { data, error } = await supabase.rpc('get_session_rotation_state', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? {
    rotation: null,
    total_rounds: 0,
    player_count: 0,
  }) as SessionRotationState;
};

export const generateSessionRotation = async (
  activityId: string,
  courtCount?: number
): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_session_rotation', {
    p_activity_id: activityId,
    p_court_count: courtCount ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to generate rotation');
  }
  await trackProductEvent('rotation_generated', {
    activity_id: activityId,
    rotation_id: data,
    court_count: courtCount,
  });
  return data as string;
};
