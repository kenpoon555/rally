export type ConversationType = 'activity_group' | 'friend_direct' | 'crew_group';

export interface Conversation {
  id: string;
  conversation_type: ConversationType;
  activity_id?: string | null;
  regular_group_id?: string | null;
  created_by: string;
  title?: string | null;
  pinned_announcement?: string | null;
  pinned_announcement_at?: string | null;
  pinned_announcement_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationActivity {
  id: string;
  conversation_id: string;
  activity_id: string;
  position: number;
  is_current: boolean;
  created_at: string;
  activity?: import('./activity').Activity | null;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'host' | 'member';
  joined_at: string;
  last_read_at?: string | null;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'system';
  content: string;
  created_at: string;
  updated_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  activity_id?: string | null;
}
