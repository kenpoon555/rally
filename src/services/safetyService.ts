import { supabase } from './api/supabase';
import { ProfileTrustStats, ReportContextType, ReportReason, UserBlock } from '../types/safety';
import { trackProductEvent } from './analyticsService';

export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  if (error) {
    throw new Error(`Failed to load blocks: ${error.message}`);
  }

  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.blocker_id === userId) {
      ids.add(row.blocked_id as string);
    } else {
      ids.add(row.blocker_id as string);
    }
  }
  return Array.from(ids);
}

export async function usersAreBlocked(userA: string, userB: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('users_are_blocked', {
    user_a: userA,
    user_b: userB,
  });

  if (error) {
    throw new Error(`Failed to check block status: ${error.message}`);
  }

  return Boolean(data);
}

export type BlockUserOptions = {
  contextType?: ReportContextType;
  contextId?: string;
  reportDetail?: string;
};

export async function blockUser(
  blockerId: string,
  blockedId: string,
  options?: BlockUserOptions
): Promise<void> {
  if (blockerId === blockedId) {
    throw new Error('You cannot block yourself.');
  }

  const { error } = await supabase.from('user_blocks').upsert(
    { blocker_id: blockerId, blocked_id: blockedId },
    { onConflict: 'blocker_id,blocked_id' }
  );

  if (error) {
    throw new Error(`Failed to block user: ${error.message}`);
  }

  await submitUserReport({
    reporter_id: blockerId,
    reported_id: blockedId,
    reason: 'harassment',
    detail: options?.reportDetail?.trim() || 'User blocked via Safety.',
    context_type: options?.contextType ?? 'profile',
    context_id: options?.contextId ?? null,
  });
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);

  if (error) {
    throw new Error(`Failed to unblock user: ${error.message}`);
  }
}

export async function getUsersIBlocked(userId: string): Promise<UserBlock[]> {
  const { data, error } = await supabase
    .from('user_blocks')
    .select(
      `
      id, blocker_id, blocked_id, created_at,
      blocked_profile:profiles!blocked_id(id, username)
    `
    )
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load blocked users: ${error.message}`);
  }

  return (data || []) as UserBlock[];
}

export async function getProfileTrustStats(userId: string): Promise<ProfileTrustStats> {
  const { data, error } = await supabase.rpc('get_profile_trust_stats', { p_user_id: userId });
  if (error) {
    throw new Error(`Failed to load trust stats: ${error.message}`);
  }
  const row = (data || {}) as ProfileTrustStats;
  return {
    no_show_count: row.no_show_count ?? 0,
    flake_count: row.flake_count ?? 0,
    pending_reports: row.pending_reports ?? 0,
  };
}

export async function submitUserReport(payload: {
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  detail?: string;
  context_type?: ReportContextType;
  context_id?: string;
}): Promise<void> {
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: payload.reporter_id,
    reported_id: payload.reported_id,
    reason: payload.reason,
    detail: payload.detail?.trim() || null,
    context_type: payload.context_type || 'profile',
    context_id: payload.context_id || null,
    status: 'pending',
  });

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
  }
}

export async function recordActivityNoShow(payload: {
  activity_id: string;
  reporter_id: string;
  reported_user_id: string;
}): Promise<void> {
  const { error } = await supabase.from('activity_no_shows').insert({
    activity_id: payload.activity_id,
    reporter_id: payload.reporter_id,
    reported_user_id: payload.reported_user_id,
  });

  if (error) {
    if (error.message.includes('duplicate') || error.code === '23505') {
      throw new Error('You already recorded a no-show for this player on this game.');
    }
    throw new Error(`Failed to record no-show: ${error.message}`);
  }

  await trackProductEvent(
    'no_show_reported',
    {
      activity_id: payload.activity_id,
      reported_user_id: payload.reported_user_id,
    },
    payload.reporter_id
  );
}

export async function updatePushQuietHours(
  userId: string,
  startHour: number | null,
  endHour: number | null
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      push_quiet_hours_start: startHour,
      push_quiet_hours_end: endHour,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update quiet hours: ${error.message}`);
  }
}

/** True if local hour (0-23) falls inside [start, end) with wrap-around support. */
export function isWithinQuietHours(
  localHour: number,
  start: number | null | undefined,
  end: number | null | undefined
): boolean {
  if (start == null || end == null) {
    return false;
  }
  if (start === end) {
    return true;
  }
  if (start < end) {
    return localHour >= start && localHour < end;
  }
  return localHour >= start || localHour < end;
}
