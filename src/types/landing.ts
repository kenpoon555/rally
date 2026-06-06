import { CoachListing, IntroSession, PartnerVenue, SportTemplate } from './sportTemplate';

export interface SportLandingNeedPost {
  id: string;
  spot_count: number;
  starts_at: string;
  skill_level: string;
  location_name?: string | null;
  host_username: string;
}

export interface SportLandingCaptain {
  id: string;
  username: string;
  profile_photo_url?: string | null;
  sport: string;
  city: string;
  rally_name?: string | null;
}

export interface SportLandingPayload {
  city: string;
  sport: string;
  slug: string;
  tagline: string;
  open_games_count: number;
  free_agent_count: number;
  need_posts: SportLandingNeedPost[];
  captains: SportLandingCaptain[];
  partner_venues?: PartnerVenue[];
  intro_sessions?: IntroSession[];
  coach_listings?: CoachListing[];
  sport_template?: SportTemplate | null;
}
