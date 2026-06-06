export interface RotationPlayer {
  user_id: string;
  username: string;
}

export interface RotationCourt {
  court_number: number;
  players: RotationPlayer[];
}

export interface SessionRotation {
  id: string;
  round_number: number;
  config: {
    court_count?: number;
    sitting_out?: string[];
    sitting_out_players?: RotationPlayer[];
  };
  created_at: string;
  courts: RotationCourt[];
}

export interface SessionRotationState {
  rotation: SessionRotation | null;
  total_rounds: number;
  player_count: number;
}
