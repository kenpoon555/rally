import { SportType } from '../constants/sports';

export type CaptainApplicationStatus = 'pending' | 'approved' | 'declined';
export type SportCaptainStatus = 'pending' | 'active' | 'inactive';

export interface SportCaptain {
  id: string;
  sport: SportType | string;
  city: string;
  sub_market?: string | null;
  status: SportCaptainStatus;
  regular_group_id?: string | null;
  approved_at?: string | null;
}

export interface CaptainApplication {
  id: string;
  sport: SportType | string;
  city: string;
  status: CaptainApplicationStatus;
  typical_game_note?: string | null;
  regular_group_id?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface CaptainStatusPayload {
  captains: SportCaptain[];
  applications: CaptainApplication[];
}

export interface PendingCaptainApplicationRow {
  id: string;
  user_id: string;
  username: string;
  sport: string;
  city: string;
  sub_market?: string | null;
  typical_game_note?: string | null;
  regular_group_id?: string | null;
  created_at: string;
}
