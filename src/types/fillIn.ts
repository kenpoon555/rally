export type FillInSource = 'free_agent' | 'seeker';

export interface FillInSuggestion {
  source: FillInSource;
  post_id?: string | null;
  user_id: string;
  username: string;
  profile_photo_url?: string | null;
  skill_level?: string | null;
  availability?: { preset?: string; note?: string } | null;
  note?: string | null;
  match_score: number;
  invite_pending?: boolean;
}

export interface FillInvite {
  id: string;
  activity_id: string;
  host_user_id: string;
  source: FillInSource;
  created_at: string;
  host_username: string;
  sport_type: string;
  start_time: string;
  location_name?: string | null;
  open_spots: number;
}
