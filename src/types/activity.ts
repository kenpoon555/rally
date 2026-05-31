import { SportType, ActivityVisibility } from '../constants/sports';
import { ActivityLocation } from './location';

export type ActivitySchedulingMode = 'fixed' | 'flex';
export type ActivityMatchStatus = 'open' | 'collecting' | 'finalized' | 'cancelled';
export type ActivityUrgencyLevel = 'normal' | 'tonight';
export type GameRsvpStatus = 'going' | 'maybe' | 'not_going';

export interface Activity {
  id: string;
  user_id: string;
  location_id?: string | null;
  sport_type: SportType;
  start_time: string;
  /** When the listing stops appearing in Discover (defaults to start_time). */
  expires_at?: string | null;
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
  /** Stage 3: spawned from a prior game chat (invite-only rematch). */
  source_activity_id?: string | null;
  /** Stage 3: recurring weekly series. */
  series_id?: string | null;
  urgency_level?: ActivityUrgencyLevel;
  invite_token?: string;
  created_at: string;
  updated_at: string;
  location?: ActivityLocation;
  user?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
  candidate_locations?: ActivityCandidateLocation[];
  join_requests?: JoinRequest[];
  rsvps?: ActivityRsvp[];
}

export interface ActivityRsvp {
  activity_id: string;
  user_id: string;
  status: GameRsvpStatus;
  updated_at: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface JoinRequest {
  id: string;
  activity_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  responded_at?: string;
  ready_at?: string | null;
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
