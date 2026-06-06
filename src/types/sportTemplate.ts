export interface SportTemplate {
  sport: string;
  default_roster: number;
  default_open_spots: number;
  default_duration_minutes: number;
  rotation_config?: {
    team_size?: number;
    style?: string;
    avoid_repeat_partners?: boolean;
  } | null;
  tourney_formats: string[];
  venue_field_hints: string[];
  create_game_hints?: {
    listing_title_hint?: string;
    play_intent_default?: string;
  };
}

export interface CoachListing {
  id: string;
  name: string;
  sport: string;
  city: string;
  schedule_note?: string | null;
  booking_url?: string | null;
  promo_note?: string | null;
  venue_name?: string | null;
}

export interface PartnerVenue {
  id: string;
  name: string;
  sport_type: string;
  address?: string | null;
  partner_tier?: string | null;
  promo_note?: string | null;
  booking_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IntroSession {
  id: string;
  sport_type: string;
  start_time: string;
  missing_players: number;
  listing_title?: string | null;
  location_name?: string | null;
  host_username: string;
}
