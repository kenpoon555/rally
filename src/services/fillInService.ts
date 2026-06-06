import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import { notifyFreeAgentInvite } from './pushDispatchService';
import { FillInSuggestion, FillInvite } from '../types/fillIn';

export const suggestFillIns = async (activityId: string): Promise<FillInSuggestion[]> => {
  const { data, error } = await supabase.rpc('suggest_fill_ins', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as FillInSuggestion[] | null) ?? [];
};

export const inviteFillIn = async (
  activityId: string,
  targetUserId: string,
  source: 'free_agent' | 'seeker',
  sourcePostId?: string | null
): Promise<string> => {
  const { data, error } = await supabase.rpc('invite_fill_in', {
    p_activity_id: activityId,
    p_target_user_id: targetUserId,
    p_source: source,
    p_source_post_id: sourcePostId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('fill_in_invited', {
    activity_id: activityId,
    target_user_id: targetUserId,
    source,
  });
  if (source === 'seeker') {
    try {
      await notifyFreeAgentInvite(activityId, targetUserId);
    } catch {
      // Push is best-effort.
    }
  }
  return data as string;
};

export const listMyPendingFillInvites = async (): Promise<FillInvite[]> => {
  const { data, error } = await supabase.rpc('list_my_pending_fill_invites');
  if (error) {
    throw new Error(error.message);
  }
  return (data as FillInvite[] | null) ?? [];
};

export const respondFillInvite = async (inviteId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase.rpc('respond_fill_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) {
    throw new Error(error.message);
  }
};
