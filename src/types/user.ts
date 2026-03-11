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
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  friends?: string[];
}
