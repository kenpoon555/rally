import { supabase } from './api/supabase';
import { trackProductEvent } from './analyticsService';
import { notifyGameFriendInvite } from './pushDispatchService';
import { GameFriendInvite, GameFriendOutgoingInvite } from '../types/gameFriendInvite';

export const inviteFriendToActivity = async (
  activityId: string,
  friendUserId: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('invite_friend_to_activity', {
    p_activity_id: activityId,
    p_friend_user_id: friendUserId,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('game_friend_invited', {
    activity_id: activityId,
    friend_user_id: friendUserId,
  });
  try {
    await notifyGameFriendInvite(activityId, friendUserId);
  } catch {
    // Push is best-effort.
  }
  return data as string;
};

export const listActivityOutgoingFriendInvites = async (
  activityId: string
): Promise<GameFriendOutgoingInvite[]> => {
  const { data, error } = await supabase.rpc('list_activity_outgoing_friend_invites', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as GameFriendOutgoingInvite[] | null) ?? [];
};

export const listMyPendingGameFriendInvites = async (): Promise<GameFriendInvite[]> => {
  const { data, error } = await supabase.rpc('list_my_pending_game_friend_invites');
  if (error) {
    throw new Error(error.message);
  }
  return (data as GameFriendInvite[] | null) ?? [];
};

export const respondGameFriendInvite = async (inviteId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase.rpc('respond_game_friend_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) {
    throw new Error(error.message);
  }
};
