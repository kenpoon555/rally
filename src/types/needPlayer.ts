import { SportType } from '../constants/sports';

export type NeedPlayerSkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'open';
export type NeedPlayerPostStatus = 'open' | 'filled' | 'cancelled' | 'expired';
export type NeedPlayerRequestStatus = 'pending' | 'accepted' | 'declined';

export interface NeedPlayerPost {
  id: string;
  activity_id: string;
  host_user_id: string;
  sport: SportType | string;
  city: string;
  spot_count: number;
  skill_level: NeedPlayerSkillLevel;
  starts_at: string;
  note?: string | null;
  status: NeedPlayerPostStatus;
  created_at: string;
  location_name?: string | null;
  location_address?: string | null;
  host_username: string;
  host_photo_url?: string | null;
  host_is_captain: boolean;
  my_request_pending?: boolean;
  my_request_accepted?: boolean;
}

export interface NeedPlayerRequest {
  id: string;
  post_id: string;
  user_id: string;
  message?: string | null;
  status: NeedPlayerRequestStatus;
  created_at: string;
  username: string;
  profile_photo_url?: string | null;
}

export interface OpenNeedPostSummary {
  id: string;
  spot_count: number;
  skill_level: NeedPlayerSkillLevel;
  status: NeedPlayerPostStatus;
  created_at: string;
}
