import { SportType } from '../constants/sports';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  username: string;
  nickname?: string;
  profile_photo_url?: string;
  preferred_sports: SportType[];
  default_duration?: number;
  default_visibility?: 'friends' | 'nearby';
  default_distance_meters?: number;
  default_time_window_start?: string;
  default_time_window_end?: string;
  onboarding_completed?: boolean;
  review_count?: number;
  visible_review_score?: number | null;
  is_suspended?: boolean;
  push_quiet_hours_start?: number | null;
  push_quiet_hours_end?: number | null;
  tos_accepted_at?: string | null;
  tos_version?: string | null;
  location_privacy_ack_at?: string | null;
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  friends?: string[];
}
