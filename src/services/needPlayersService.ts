import { supabase } from './api/supabase';
import { SportType } from '../constants/sports';
import {
  NeedPlayerPost,
  NeedPlayerRequest,
  NeedPlayerSkillLevel,
  OpenNeedPostSummary,
} from '../types/needPlayer';
import { trackProductEvent } from './analyticsService';
import { BETA_REGION } from '../constants/betaRegion';

export { NEED_PLAYERS_BOARD_SPORTS as NEED_PLAYERS_SPORTS } from '../config/surfaceVisibility';

export const listNeedPlayerPosts = async (
  sport?: SportType | string | null
): Promise<NeedPlayerPost[]> => {
  const { data, error } = await supabase.rpc('list_need_player_posts', {
    p_sport: sport ?? null,
    p_city: BETA_REGION.name,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as NeedPlayerPost[] | null) ?? [];
};

export const createNeedPlayerPost = async (
  activityId: string,
  skillLevel: NeedPlayerSkillLevel = 'open',
  note?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('create_need_player_post', {
    p_activity_id: activityId,
    p_skill_level: skillLevel,
    p_note: note?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('need_post_created', {
    activity_id: activityId,
    skill_level: skillLevel,
  });
  return data as string;
};

export const requestNeedPlayerSpot = async (
  postId: string,
  message?: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('request_need_player_spot', {
    p_post_id: postId,
    p_message: message?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as string;
};

export const listNeedPlayerRequestsForActivity = async (
  activityId: string
): Promise<NeedPlayerRequest[]> => {
  const { data, error } = await supabase.rpc('list_need_player_requests_for_activity', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as NeedPlayerRequest[] | null) ?? [];
};

export const respondNeedPlayerRequest = async (
  requestId: string,
  accept: boolean
): Promise<void> => {
  const { error } = await supabase.rpc('respond_need_player_request', {
    p_request_id: requestId,
    p_accept: accept,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const getOpenNeedPostForActivity = async (
  activityId: string
): Promise<OpenNeedPostSummary | null> => {
  const { data, error } = await supabase.rpc('get_open_need_post_for_activity', {
    p_activity_id: activityId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as OpenNeedPostSummary | null) ?? null;
};

export const cancelNeedPlayerPost = async (postId: string): Promise<void> => {
  const { error } = await supabase.rpc('cancel_need_player_post', {
    p_post_id: postId,
  });
  if (error) {
    throw new Error(error.message);
  }
};
