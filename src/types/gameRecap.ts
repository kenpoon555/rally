export interface GameRecapAttendee {
  user_id: string;
  username: string;
}

export interface GameRecapStreakHighlight {
  user_id: string;
  username: string;
  week_streak: number;
}

export interface GameRecap {
  recap_id?: string;
  activity_id: string;
  group_id?: string | null;
  group_name?: string | null;
  sport_type: string;
  court_name?: string | null;
  start_time: string;
  duration: number;
  attendees: GameRecapAttendee[];
  attendee_count: number;
  rotation_rounds?: number;
  streak_highlight?: GameRecapStreakHighlight | null;
  created_at?: string;
}

export interface VenueDetails {
  id: string;
  name: string;
  sport_type: string;
  address?: string | null;
  parking_note?: string | null;
  booking_url?: string | null;
  busy_notes?: string | null;
  hours_text?: string | null;
  is_active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  partner_tier?: string | null;
  logo_url?: string | null;
  promo_note?: string | null;
}
