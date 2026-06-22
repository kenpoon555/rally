import { supabase } from './api/supabase';
import { Activity } from '../types/activity';
import { RegularGroup } from '../types/regularGroup';
import {
  AcceptRallyFriendInviteResult,
  RallyFriendInvite,
  RallyOutgoingInvite,
} from '../types/rallyInvite';
import { trackProductEvent, trackCrewJoined } from './analyticsService';

export const createRegularGroupFromActivity = async (
  activityId: string,
  name?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_regular_group_from_activity', {
    p_activity_id: activityId,
    p_name: name?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Failed to create Rally');
  }
  void trackProductEvent('regular_group_created', {
    group_id: data,
    source_activity_id: activityId,
  });
  return data as string;
};

export const joinRegularGroupViaInvite = async (inviteToken: string): Promise<string> => {
  const { data, error } = await supabase.rpc('join_regular_group_via_invite', {
    p_invite_token: inviteToken,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Group invite could not be redeemed');
  }
  void trackProductEvent('crew_invite_redeemed', { group_id: data, via: 'group_only' });
  trackCrewJoined(data as string);
  return data as string;
};

export interface JoinGroupResult {
  groupId: string;
  activityId: string | null;
  conversationId: string | null;
  joinedGame: boolean;
  joinGameError: string | null;
}

/** Unified invite: join the Regulars crew and its next scheduled game in one call. */
export const joinGroupAndNextGame = async (inviteToken: string): Promise<JoinGroupResult> => {
  const { data, error } = await supabase.rpc('join_group_and_next_game', {
    p_group_invite_token: inviteToken,
  });
  if (error) {
    throw new Error(error.message);
  }
  const result = (data ?? {}) as {
    group_id?: string;
    activity_id?: string | null;
    conversation_id?: string | null;
    joined_game?: boolean;
    join_game_error?: string | null;
  };
  if (!result.group_id) {
    throw new Error('Group invite could not be redeemed');
  }
  void trackProductEvent('crew_invite_redeemed', {
    group_id: result.group_id,
    activity_id: result.activity_id ?? null,
    via: 'group_and_next_game',
  });
  trackCrewJoined(result.group_id);
  return {
    groupId: result.group_id,
    activityId: result.activity_id ?? null,
    conversationId: result.conversation_id ?? null,
    joinedGame: Boolean(result.joined_game),
    joinGameError: result.join_game_error ?? null,
  };
};

export type JoinCrewGameResult =
  | 'joined'
  | 'already_joined'
  | 'waitlisted'
  | 'host';

export const joinCrewGame = async (activityId: string): Promise<JoinCrewGameResult> => {
  const { data, error } = await supabase.rpc('join_crew_game', { p_activity_id: activityId });
  if (error) {
    throw new Error(error.message);
  }
  const status = (data as { status?: string } | null)?.status;
  if (status === 'waitlisted') return 'waitlisted';
  if (status === 'already_joined') return 'already_joined';
  if (status === 'host') return 'host';
  return 'joined';
};

export const getRegularGroupById = async (groupId: string): Promise<RegularGroup | null> => {
  const { data, error } = await supabase
    .from('regular_groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as RegularGroup | null) ?? null;
};

const RALLY_NAME_MAX = 80;

export const updateRegularGroupName = async (
  groupId: string,
  name: string
): Promise<RegularGroup> => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Enter a Rally name.');
  }
  if (trimmed.length > RALLY_NAME_MAX) {
    throw new Error(`Keep the name under ${RALLY_NAME_MAX} characters.`);
  }

  const { data, error } = await supabase
    .from('regular_groups')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', groupId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from('conversations')
    .update({ title: trimmed })
    .eq('regular_group_id', groupId)
    .eq('conversation_type', 'crew_group');

  return data as RegularGroup;
};

export const isRegularGroupMember = async (
  groupId: string,
  userId: string
): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_regular_group_member', {
    p_group_id: groupId,
    p_user_id: userId,
  });
  if (error) {
    return false;
  }
  return Boolean(data);
};

export interface RegularGroupMemberRow {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: { id: string; username: string };
}

export const getRegularGroupMembers = async (
  groupId: string
): Promise<RegularGroupMemberRow[]> => {
  const { data, error } = await supabase
    .from('regular_group_members')
    .select('group_id, user_id, role, joined_at')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as RegularGroupMemberRow[];
  if (rows.length === 0) {
    return [];
  }
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .in(
      'id',
      rows.map((row) => row.user_id)
    );
  if (profileError) {
    throw new Error(profileError.message);
  }
  const nameById = new Map(
    (profiles ?? []).map((row) => [row.id as string, row.username as string])
  );
  return rows.map((row) => ({
    ...row,
    user: { id: row.user_id, username: nameById.get(row.user_id) ?? 'Player' },
  }));
};

export const getMyRegularGroups = async (userId: string): Promise<RegularGroup[]> => {
  const { data: memberships, error: memberError } = await supabase
    .from('regular_group_members')
    .select('group_id')
    .eq('user_id', userId);
  if (memberError) {
    throw new Error(memberError.message);
  }

  const groupIds = (memberships ?? []).map((row) => row.group_id as string);
  if (groupIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('regular_groups')
    .select('*')
    .in('id', groupIds)
    .order('updated_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as RegularGroup[];
};

/** Soonest active upcoming game for a crew. */
export const getUpcomingCrewActivity = async (
  groupId: string
): Promise<Activity | null> => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(id, name, sport_type, location),
      join_requests(id, user_id, status, ready_at, user:profiles!join_requests_user_id_fkey(id, username)),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('regular_group_id', groupId)
    .eq('status', 'active')
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Activity | null) ?? null;
};

export const getCrewActivities = async (groupId: string): Promise<Activity[]> => {
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      location:activity_locations(id, name, sport_type, location),
      join_requests(id, user_id, status, ready_at, user:profiles!join_requests_user_id_fkey(id, username)),
      user:profiles!activities_user_id_fkey(id, username, profile_photo_url)
    `
    )
    .eq('regular_group_id', groupId)
    .order('start_time', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Activity[];
};

export const inviteFriendToRegularGroup = async (
  groupId: string,
  friendUserId: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('invite_friend_to_regular_group', {
    p_group_id: groupId,
    p_friend_user_id: friendUserId,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error('Could not send invite.');
  }
  void trackProductEvent('rally_friend_invite_sent', {
    group_id: groupId,
    friend_user_id: friendUserId,
  });
  return data as string;
};

export const acceptRegularGroupFriendInvite = async (
  inviteId: string
): Promise<AcceptRallyFriendInviteResult> => {
  const { data, error } = await supabase.rpc('accept_regular_group_friend_invite', {
    p_invite_id: inviteId,
  });
  if (error) {
    throw new Error(error.message);
  }
  const result = (data ?? {}) as AcceptRallyFriendInviteResult;
  if (!result.group_id) {
    throw new Error('Could not accept invite.');
  }
  void trackProductEvent('rally_friend_invite_accepted', {
    group_id: result.group_id,
    invite_id: inviteId,
  });
  trackCrewJoined(result.group_id);
  return result;
};

export const declineRegularGroupFriendInvite = async (inviteId: string): Promise<void> => {
  const { error } = await supabase.rpc('decline_regular_group_friend_invite', {
    p_invite_id: inviteId,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const listMyPendingRegularGroupInvites = async (): Promise<RallyFriendInvite[]> => {
  const { data, error } = await supabase.rpc('list_my_pending_regular_group_invites');
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as RallyFriendInvite[];
};

export const listRegularGroupOutgoingInvites = async (
  groupId: string
): Promise<RallyOutgoingInvite[]> => {
  const { data, error } = await supabase.rpc('list_regular_group_outgoing_invites', {
    p_group_id: groupId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as RallyOutgoingInvite[];
};
