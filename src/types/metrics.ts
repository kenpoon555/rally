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
  | 'friend_connection_made';

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number | null;
  metric?: string;
  skipped?: boolean;
}
