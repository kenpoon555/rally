import { supabase } from './api/supabase';
import { SportType } from '../constants/sports';
import {
  CaptainStatusPayload,
  PendingCaptainApplicationRow,
} from '../types/captain';
import { trackProductEvent } from './analyticsService';
import { BETA_REGION } from '../constants/betaRegion';

export const submitCaptainApplication = async (params: {
  sport: SportType | string;
  typicalGameNote?: string;
  regularGroupId?: string | null;
  subMarket?: string;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('submit_captain_application', {
    p_sport: params.sport,
    p_city: BETA_REGION.name,
    p_typical_game_note: params.typicalGameNote?.trim() || null,
    p_regular_group_id: params.regularGroupId ?? null,
    p_sub_market: params.subMarket?.trim() || null,
  });
  if (error) {
    throw new Error(error.message);
  }
  await trackProductEvent('captain_application_submitted', {
    sport: params.sport,
    regular_group_id: params.regularGroupId ?? null,
  });
  return data as string;
};

export const getMyCaptainStatus = async (): Promise<CaptainStatusPayload> => {
  const { data, error } = await supabase.rpc('get_my_captain_status');
  if (error) {
    throw new Error(error.message);
  }
  const payload = (data ?? {}) as CaptainStatusPayload;
  return {
    captains: payload.captains ?? [],
    applications: payload.applications ?? [],
  };
};

export const listPendingCaptainApplications =
  async (): Promise<PendingCaptainApplicationRow[]> => {
    const { data, error } = await supabase.rpc('admin_list_pending_captain_applications', {
      p_limit: 50,
    });
    if (error) {
      throw new Error(error.message);
    }
    return (data as PendingCaptainApplicationRow[] | null) ?? [];
  };

export const approveCaptainApplication = async (
  applicationId: string,
  regularGroupId?: string | null
): Promise<void> => {
  const { error } = await supabase.rpc('admin_approve_captain_application', {
    p_application_id: applicationId,
    p_regular_group_id: regularGroupId ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const formatSkillLevelLabel = (level: string): string => {
  switch (level) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    default:
      return 'All levels';
  }
};
