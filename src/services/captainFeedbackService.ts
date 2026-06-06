import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';

export type CaptainFeedbackRow = {
  id: string;
  sport: string;
  feature_area: string;
  friction_score: number;
  note: string;
  activity_id?: string | null;
  created_at: string;
  username: string;
};

export const submitCaptainFeedback = async (params: {
  sport: string;
  featureArea: string;
  frictionScore: number;
  note: string;
  activityId?: string | null;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('submit_captain_feedback', {
    p_sport: params.sport,
    p_feature_area: params.featureArea,
    p_friction_score: params.frictionScore,
    p_note: params.note,
    p_activity_id: params.activityId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('captain_feedback_submitted', {
    sport: params.sport,
    feature_area: params.featureArea,
  });
  return data as string;
};

export const listCaptainFeedbackAdmin = async (): Promise<CaptainFeedbackRow[]> => {
  const { data, error } = await supabase.rpc('admin_list_captain_feedback', { p_limit: 30 });
  if (error) {
    throw new Error(error.message);
  }
  return (data as CaptainFeedbackRow[] | null) ?? [];
};
