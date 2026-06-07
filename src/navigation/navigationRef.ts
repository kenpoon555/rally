import { createNavigationContainerRef } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';

export type RootStackParamList = {
  MainTabs: undefined;
  [ROUTES.ACTIVITY.DETAIL]: { activityId?: string; inviteToken?: string; fromGameRoom?: boolean };
  [ROUTES.ACTIVITY.CREATE]: undefined;
  [ROUTES.PROFILE.MAIN]: undefined;
  [ROUTES.CHAT.TAB]: undefined;
  [ROUTES.CHAT.THREAD]: { conversationId: string; title?: string; activityId?: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const ACTIVITY_PUSH_TYPES = new Set([
  'join_request',
  'join_request_approved',
  'join_request_rejected',
  'game_finalized',
  'roster_nudge',
  'free_agent_invite',
  'fill_in_invite',
  'game_friend_invite',
  'review_prompt',
]);

const GAME_ROOM_PUSH_TYPES = new Set(['game_finalized', 'roster_nudge', 'join_request_approved']);

export function navigateFromNotificationData(data: Record<string, string> | undefined): void {
  if (!data || !navigationRef.isReady()) {
    return;
  }

  const type = data.type;
  const activityId = data.activity_id;

  if (type && ACTIVITY_PUSH_TYPES.has(type) && activityId) {
    navigationRef.navigate(ROUTES.ACTIVITY.DETAIL as any, {
      activityId,
      fromGameRoom: GAME_ROOM_PUSH_TYPES.has(type) ? true : undefined,
    });
    return;
  }

  if (
    (type === 'chat' || type === 'chat_message') &&
    data.conversation_id
  ) {
    navigationRef.navigate(ROUTES.CHAT.THREAD as any, {
      conversationId: data.conversation_id,
      title: data.title || 'Chat',
      activityId: data.activity_id || undefined,
    });
  }
}
