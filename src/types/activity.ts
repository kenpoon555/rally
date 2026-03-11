import { SportType, ActivityVisibility } from '../constants/sports';
import { ActivityLocation } from './location';

export type ActivitySchedulingMode = 'fixed' | 'flex';
export type ActivityMatchStatus = 'open' | 'collecting' | 'finalized' | 'cancelled';

export interface Activity {
  id: string;
  user_id: string;
  location_id?: string | null;
  sport_type: SportType;
  start_time: string;
  duration: number; // minutes
  visibility: ActivityVisibility;
  player_count: number;
  missing_players?: number;
  status: 'active' | 'completed' | 'cancelled';
  scheduling_mode?: ActivitySchedulingMode;
  preference_deadline?: string | null;
  window_start?: string | null;
  window_end?: string | null;
  match_status?: ActivityMatchStatus;
  finalized_at?: string | null;
  finalized_by?: string | null;
  created_at: string;
  updated_at: string;
  location?: ActivityLocation;
  user?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
  candidate_locations?: ActivityCandidateLocation[];
}

export interface JoinRequest {
  id: string;
  activity_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  responded_at?: string;
  user?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
}

export interface ActivityCandidateLocation {
  id: string;
  activity_id: string;
  location_id: string;
  priority_order: number;
  created_at: string;
  location?: ActivityLocation;
}

export interface ActivityParticipantPreference {
  id: string;
  activity_id: string;
  user_id: string;
  earliest_start?: string | null;
  latest_start?: string | null;
  preferred_duration?: number | null;
  preferred_location_id?: string | null;
  availability_weight: number;
  notes?: string | null;
  submitted_at: string;
  updated_at: string;
}

export interface FinalizedActivityResult {
  final_start_time: string;
  final_location_id: string | null;
  matched_participants: number;
  score: number;
}
