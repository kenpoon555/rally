import { supabase } from './api/supabase';
import { RegularGroup } from '../types/regularGroup';

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
    throw new Error('Failed to create Regulars group');
  }
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
  return data as string;
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
