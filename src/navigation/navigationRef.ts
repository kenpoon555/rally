import { createNavigationContainerRef } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';

export type RootStackParamList = {
  MainTabs: undefined;
  [ROUTES.ACTIVITY.DETAIL]: { activityId?: string; inviteToken?: string };
  [ROUTES.ACTIVITY.CREATE]: undefined;
  [ROUTES.PROFILE.MAIN]: undefined;
  [ROUTES.CHAT.TAB]: undefined;
  [ROUTES.CHAT.THREAD]: { conversationId: string; title?: string; activityId?: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateFromNotificationData(data: Record<string, string> | undefined): void {
  if (!data || !navigationRef.isReady()) {
    return;
  }

  const type = data.type;
  const activityId = data.activity_id;

  if ((type === 'join_request' || type === 'join_request_approved' || type === 'review_prompt') && activityId) {
    navigationRef.navigate(ROUTES.ACTIVITY.DETAIL as any, { activityId });
    return;
  }

  if (type === 'chat' && data.conversation_id) {
    navigationRef.navigate(ROUTES.CHAT.THREAD as any, {
      conversationId: data.conversation_id,
      title: data.title || 'Chat',
    });
  }
}
