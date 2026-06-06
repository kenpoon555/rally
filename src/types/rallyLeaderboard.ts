export type RallyLeaderboardWindow = 'all' | '90';

export interface RallyLeaderboardEntry {
  user_id: string;
  username: string;
  role: string;
  sessions_attended: number;
  games_played: number;
  week_streak: number;
  tournament_wins: number;
  tournament_losses: number;
  rank: number;
}
