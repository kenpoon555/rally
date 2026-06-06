import { SportType } from '../constants/sports';

export type RegularGroupMemberRole = 'host' | 'member' | 'captain';

export interface RegularGroup {
  id: string;
  host_id: string;
  name: string;
  sport_type: SportType;
  default_location_id?: string | null;
  series_id?: string | null;
  source_activity_id?: string | null;
  invite_token: string;
  is_partner_rally?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegularGroupMember {
  group_id: string;
  user_id: string;
  role: RegularGroupMemberRole;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
}
