export type RallyFriendInviteStatus = 'pending' | 'accepted' | 'declined';

export interface RallyFriendInvite {
  id: string;
  group_id: string;
  group_name: string;
  sport_type: string;
  invited_by: string;
  inviter_username: string;
  created_at: string;
}

export interface RallyOutgoingInvite {
  id: string;
  invited_user_id: string;
  invited_username: string;
  status: RallyFriendInviteStatus;
  created_at: string;
}

export interface AcceptRallyFriendInviteResult {
  group_id: string;
  conversation_id: string;
}
