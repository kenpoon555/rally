export type MiniTournamentStatus = 'open' | 'active' | 'completed';

export interface MiniTournament {
  id: string;
  group_id: string;
  host_id: string;
  name: string;
  sport_type: string;
  status: MiniTournamentStatus;
  created_at: string;
  started_at?: string | null;
}

export interface MiniTournamentMember {
  tournament_id: string;
  user_id: string;
  wins: number;
  losses: number;
  points: number;
  joined_at: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface MiniTournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  home_user_1: string;
  home_user_2?: string | null;
  away_user_1: string;
  away_user_2?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  status: 'pending' | 'done';
  created_at: string;
  home_users?: { username: string }[];
  away_users?: { username: string }[];
}
