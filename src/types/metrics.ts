export type RateLimitMetric =
  | 'discovery_search'
  | 'chat_message'
  | 'push_send'
  | 'chat_create';

export type ProductEventName =
  | 'discover_refreshed'
  | 'join_request_created'
  | 'join_request_approved'
  | 'conversation_opened'
  | 'message_sent'
  | 'activity_chat_opened'
  | 'game_hosted'
  | 'no_show_reported'
  | 'repeat_game_detected'
  | 'friend_connection_made'
  | 'regular_group_created'
  | 'crew_invite_redeemed'
  | 'crew_replayed'
  | 'poll_created'
  | 'poll_voted'
  | 'rotation_generated'
  | 'recap_shared'
  | 'free_agent_post_created'
  | 'free_agent_invited'
  | 'need_post_created'
  | 'game_friend_invited'
  | 'fill_in_invited'
  | 'concierge_request_submitted'
  | 'captain_application_submitted'
  | 'captain_feedback_submitted'
  | 'rally_friend_invite_sent'
  | 'rally_friend_invite_accepted'
  | 'crew_dormancy_nudge_sent';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number | null;
  metric?: string;
  skipped?: boolean;
}
