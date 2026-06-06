import { supabase } from './api/supabase';
import { SportType } from '../constants/sports';
import { BETA_REGION } from '../constants/betaRegion';
import { trackProductEvent } from './analyticsService';
import { notifyFreeAgentInvite } from './pushDispatchService';
import {
  FreeAgentAvailabilityPreset,
  FreeAgentInvite,
  FreeAgentPost,
  MyFreeAgentPost,
  SuggestedFreeAgent,
} from '../types/freeAgent';
import { NeedPlayerSkillLevel } from '../types/needPlayer';
import { formatSkillLevelLabel } from './captainService';

export const FREE_AGENT_SPORTS: SportType[] = ['Badminton', 'Pickleball'];

export const formatAvailabilityLabel = (preset: FreeAgentAvailabilityPreset): string => {
  switch (preset) {
    case 'weeknights':
      return 'Weeknights';
    case 'weekends':
      return 'Weekends';
    default:
      return 'Flexible';
  }
};

export const createFreeAgentPost = async (params: {
  sport: SportType | string;
  skillLevel?: NeedPlayerSkillLevel;
  availabilityPreset?: FreeAgentAvailabilityPreset;
  note?: string;
  expiresDays?: number;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('create_free_agent_post', {
    p_sport: params.sport,
    p_skill_level: params.skillLevel ?? 'open',
    p_availability_preset: params.availabilityPreset ?? 'flexible',
    p_note: params.note?.trim() || null,
    p_expires_days: params.expiresDays ?? 14,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('free_agent_post_created', { sport: params.sport });
  return data as string;
};

export const cancelFreeAgentPost = async (postId: string): Promise<void> => {
  const { error } = await supabase.rpc('cancel_free_agent_post', { p_post_id: postId });
  if (error) {
    throw new Error(error.message);
  }
};

export const getMyFreeAgentPost = async (
  sport?: SportType | string | null
): Promise<MyFreeAgentPost | null> => {
  const { data, error } = await supabase.rpc('get_my_free_agent_post', {
    p_sport: sport ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as MyFreeAgentPost | null) ?? null;
};

export const listFreeAgentPosts = async (
  sport?: SportType | string | null
): Promise<FreeAgentPost[]> => {
  const { data, error } = await supabase.rpc('list_free_agent_posts', {
    p_sport: sport ?? null,
    p_city: BETA_REGION.name,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as FreeAgentPost[] | null) ?? [];
};

export const inviteFreeAgent = async (
  postId: string,
  activityId: string,
  agentUserId: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('invite_free_agent', {
    p_post_id: postId,
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('free_agent_invited', { post_id: postId, activity_id: activityId });
  try {
    await notifyFreeAgentInvite(activityId, agentUserId);
  } catch {
    // Push is best-effort.
  }
  return data as string;
};

export const listSuggestedFreeAgentsForActivity = async (
  activityId: string
): Promise<SuggestedFreeAgent[]> => {
  const { data, error } = await supabase.rpc('list_suggested_free_agents_for_activity', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as SuggestedFreeAgent[] | null) ?? [];
};

export const listMyPendingFreeAgentInvites = async (): Promise<FreeAgentInvite[]> => {
  const { data, error } = await supabase.rpc('list_my_pending_free_agent_invites');
  if (error) {
    throw new Error(error.message);
  }
  return (data as FreeAgentInvite[] | null) ?? [];
};

export const respondFreeAgentInvite = async (inviteId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase.rpc('respond_free_agent_invite', {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const formatSkillLabel = (level: string): string => formatSkillLevelLabel(level);
