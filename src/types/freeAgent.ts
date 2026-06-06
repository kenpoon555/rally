import { SportType } from '../constants/sports';
import { NeedPlayerSkillLevel } from './needPlayer';

export type FreeAgentAvailabilityPreset = 'weeknights' | 'weekends' | 'flexible';

export interface FreeAgentAvailability {
  preset: FreeAgentAvailabilityPreset;
  note?: string | null;
}

export interface FreeAgentPost {
  id: string;
  user_id: string;
  sport: SportType | string;
  city: string;
  skill_level: NeedPlayerSkillLevel;
  availability: FreeAgentAvailability;
  note?: string | null;
  expires_at: string;
  created_at: string;
  username: string;
  profile_photo_url?: string | null;
  is_captain?: boolean;
}

export interface MyFreeAgentPost {
  id: string;
  sport: string;
  skill_level: NeedPlayerSkillLevel;
  availability: FreeAgentAvailability;
  note?: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface SuggestedFreeAgent extends FreeAgentPost {
  match_score: number;
  invite_pending?: boolean;
}

export interface FreeAgentInvite {
  id: string;
  post_id: string;
  activity_id: string;
  host_user_id: string;
  status: string;
  created_at: string;
  host_username: string;
  sport_type: string;
  start_time: string;
  location_name?: string | null;
  open_spots: number;
}
