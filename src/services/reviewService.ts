import { supabase } from './api/supabase';
import { PlayerReview, ProfileReviewStats } from '../types/review';

export const submitPlayerReview = async (payload: {
  activity_id: string;
  reviewer_id: string;
  reviewed_id: string;
  friendliness_rating: number;
  physicality_rating: number;
  overall_vibe_rating: number;
  comment?: string;
}): Promise<PlayerReview> => {
  const { data, error } = await supabase
    .from('player_reviews')
    .upsert(payload, {
      onConflict: 'activity_id,reviewer_id,reviewed_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit review: ${error.message}`);
  }

  return data as PlayerReview;
};

export const getReviewsForUser = async (userId: string): Promise<PlayerReview[]> => {
  const { data, error } = await supabase
    .from('player_reviews')
    .select('*')
    .eq('reviewed_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load reviews: ${error.message}`);
  }

  return (data || []) as PlayerReview[];
};

export const getProfileReviewStats = async (
  userId: string
): Promise<ProfileReviewStats | null> => {
  const { data, error } = await supabase
    .from('profile_review_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load review stats: ${error.message}`);
  }

  return (data as ProfileReviewStats) || null;
};

export const canViewProfileIdentity = async (
  targetUserId: string,
  contextActivityId?: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('can_view_profile_identity', {
    target_user_id: targetUserId,
    context_activity_id: contextActivityId || null,
  });

  if (error) {
    return false;
  }

  return Boolean(data);
};
