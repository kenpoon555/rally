export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  user?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
  friend?: {
    id: string;
    username: string;
    profile_photo_url?: string;
  };
}
