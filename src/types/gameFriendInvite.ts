export interface GameFriendOutgoingInvite {
  id: string;
  invited_user_id: string;
  status: string;
  created_at: string;
  invited_username: string;
}

export interface GameFriendInvite {
  id: string;
  activity_id: string;
  invited_by: string;
  created_at: string;
  inviter_username: string;
  sport_type: string;
  start_time: string;
  regular_group_id?: string | null;
  location_name?: string | null;
  open_spots: number;
}
