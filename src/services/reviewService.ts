import { supabase } from './api/supabase';
import { expireStaleActivities } from './activityService';
import { PlayerReview, ProfileReviewStats } from '../types/review';
import { isReviewWindowOpen, isActivityListingActive } from '../utils/activityExpiry';
import { Activity } from '../types/activity';

export type PendingReviewPrompt = {
  activity_id: string;
  reviewed_id: string;
  reviewed_username: string;
  court_name: string;
  sport_type: string;
  start_time: string;
  rateable: boolean;
};

type ActivityRow = Activity & {
  location?: { name?: string } | null;
  user?: { id: string; username?: string } | null;
};

export const getReviewsByReviewerForActivity = async (
  activityId: string,
  reviewerId: string
): Promise<{ reviewed_id: string }[]> => {
  const { data, error } = await supabase
    .from('player_reviews')
    .select('reviewed_id')
    .eq('activity_id', activityId)
    .eq('reviewer_id', reviewerId);

  if (error) {
    return [];
  }

  return (data || []) as { reviewed_id: string }[];
};

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

export const getPendingReviewPrompts = async (userId: string): Promise<PendingReviewPrompt[]> => {
  await expireStaleActivities();

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const [hostedRes, joinedRes, myReviewsRes] = await Promise.all([
    supabase
      .from('activities')
      .select(
        `
        id, user_id, sport_type, start_time, duration, status, expires_at, scheduling_mode, window_end,
        location:activity_locations(name)
      `
      )
      .eq('user_id', userId)
      .in('status', ['completed', 'active'])
      .gte('start_time', since),
    supabase
      .from('join_requests')
      .select('activity_id')
      .eq('user_id', userId)
      .eq('status', 'approved'),
    supabase
      .from('player_reviews')
      .select('activity_id, reviewed_id')
      .eq('reviewer_id', userId),
  ]);

  if (hostedRes.error) {
    throw new Error(`Failed to load hosted games for reviews: ${hostedRes.error.message}`);
  }
  if (joinedRes.error) {
    throw new Error(`Failed to load joined games for reviews: ${joinedRes.error.message}`);
  }

  const joinedActivityIds = [
    ...new Set((joinedRes.data || []).map((row) => row.activity_id as string)),
  ];

  let joinedActivities: ActivityRow[] = [];
  if (joinedActivityIds.length > 0) {
    const { data, error } = await supabase
      .from('activities')
      .select(
        `
        id, user_id, sport_type, start_time, duration, status, expires_at, scheduling_mode, window_end,
        location:activity_locations(name),
        user:profiles!activities_user_id_fkey(id, username)
      `
      )
      .in('id', joinedActivityIds)
      .in('status', ['completed', 'active'])
      .gte('start_time', since);

    if (error) {
      throw new Error(`Failed to load joined activities for reviews: ${error.message}`);
    }
    joinedActivities = (data || []) as ActivityRow[];
  }

  const hostedActivities = (hostedRes.data || []) as ActivityRow[];
  const hostedIds = hostedActivities.map((a) => a.id);

  let approvedByActivity = new Map<
    string,
    { user_id: string; username: string }[]
  >();

  if (hostedIds.length > 0) {
    const { data, error } = await supabase
      .from('join_requests')
      .select(
        `
        activity_id,
        user_id,
        user:profiles!join_requests_user_id_fkey(id, username)
      `
      )
      .in('activity_id', hostedIds)
      .eq('status', 'approved');

    if (error) {
      throw new Error(`Failed to load joiners for reviews: ${error.message}`);
    }

    for (const row of data || []) {
      const activityId = row.activity_id as string;
      const list = approvedByActivity.get(activityId) || [];
      const profile = row.user as { id?: string; username?: string } | null;
      list.push({
        user_id: row.user_id as string,
        username: profile?.username || 'Player',
      });
      approvedByActivity.set(activityId, list);
    }
  }

  const reviewedKeys = new Set(
    (myReviewsRes.data || []).map((r) => `${r.activity_id}:${r.reviewed_id}`)
  );
  const prompts: PendingReviewPrompt[] = [];
  const seen = new Set<string>();

  const addPrompt = (
    activity: ActivityRow,
    reviewedId: string,
    reviewedUsername: string
  ) => {
    const listingEnded =
      activity.status === 'completed' ||
      activity.status === 'cancelled' ||
      !isActivityListingActive(activity);

    if (!listingEnded) {
      return;
    }

    const key = `${activity.id}:${reviewedId}`;
    if (reviewedId === userId || reviewedKeys.has(key) || seen.has(key)) {
      return;
    }
    seen.add(key);
    prompts.push({
      activity_id: activity.id,
      reviewed_id: reviewedId,
      reviewed_username: reviewedUsername || 'Player',
      court_name: activity.location?.name || 'Court',
      sport_type: activity.sport_type,
      start_time: activity.start_time,
      rateable: isReviewWindowOpen(activity),
    });
  };

  for (const activity of hostedActivities) {
    const approved = approvedByActivity.get(activity.id) || [];
    for (const jr of approved) {
      addPrompt(activity, jr.user_id, jr.username);
    }
  }

  for (const activity of joinedActivities) {
    if (!activity.user_id) {
      continue;
    }
    addPrompt(activity, activity.user_id, activity.user?.username || 'Host');
  }

  return prompts.sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );
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
