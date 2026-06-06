export type SessionCardLockReadiness = 'ready' | 'waiting_im_in' | 'needs_players';

export type SessionCardRosterMember = {
  user_id: string;
  username: string;
  profile_photo_url?: string | null;
  role: 'host' | 'player';
  status: 'approved' | 'waitlisted';
  ready_at?: string | null;
  is_ready: boolean;
};

export type SessionCardViewer = {
  is_host: boolean;
  is_on_roster: boolean;
  is_ready: boolean;
  is_waitlisted: boolean;
  waitlist_position?: number | null;
  is_finalized: boolean;
  show_actions: boolean;
  can_nudge: boolean;
  can_lock: boolean;
  lock_readiness: SessionCardLockReadiness;
  is_full: boolean;
};

export type SessionCardPayload = {
  activity_id: string;
  host_user_id: string;
  host_username: string;
  sport_type: string;
  start_time: string;
  duration: number;
  status: string;
  match_status: string;
  session_note?: string | null;
  cost_note?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  regular_group_id?: string | null;
  player_count: number;
  missing_players: number;
  listing_title?: string | null;
  roster_count: number;
  ready_count: number;
  open_spots: number;
  waitlist_count: number;
  approved_non_host_count: number;
  roster: SessionCardRosterMember[];
  viewer: SessionCardViewer;
};

export type ConversationSessionCard = {
  conversation_activity_id: string;
  activity_id: string;
  position: number;
  is_current: boolean;
  card: SessionCardPayload;
};
