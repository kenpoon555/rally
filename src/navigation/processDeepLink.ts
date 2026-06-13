import { Alert } from 'react-native';
import { ROUTES } from '../constants/routes';
import { PRODUCT_COPY } from '../constants/productCopy';
import { navigationRef } from './navigationRef';
import { parseAppDeepLink } from './deepLinking';
import { storePendingDeepLink } from '../services/pendingDeepLinkService';
import { joinGroupAndNextGame } from '../services/regularGroupService';
import { ensureActivityGroupConversation } from '../services/chatService';
import { supabase } from '../services/api/supabase';

export async function processDeepLink(url: string, options?: { allowStorePending?: boolean }): Promise<void> {
  const allowStorePending = options?.allowStorePending !== false;

  try {
    const parsed = parseAppDeepLink(url);

    if (parsed.type === 'sportLanding' && parsed.sportSlug && navigationRef.isReady()) {
      (navigationRef as any).navigate(ROUTES.LANDING.SPORT, {
        sportSlug: parsed.sportSlug,
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const requiresGameAuth =
      parsed.type === 'game' || parsed.type === 'invite' || parsed.type === 'hostInvite';

    if (requiresGameAuth && !session?.user) {
      if (allowStorePending) {
        await storePendingDeepLink(url);
      }
      Alert.alert(
        'Sign in required',
        parsed.type === 'hostInvite'
          ? 'Log in to accept this game invite.'
          : 'Log in to view this game and request to join.'
      );
      return;
    }

    if (parsed.type === 'game' && parsed.activityId && navigationRef.isReady()) {
      (navigationRef as any).navigate(ROUTES.ACTIVITY.DETAIL, {
        activityId: parsed.activityId,
      });
      return;
    }

    if (parsed.type === 'hostInvite' && parsed.inviteToken && navigationRef.isReady()) {
      (navigationRef as any).navigate(ROUTES.ACTIVITY.DETAIL, {
        inviteToken: parsed.inviteToken,
        hostInvite: true,
      });
      return;
    }

    if (parsed.type === 'invite' && parsed.inviteToken && navigationRef.isReady()) {
      (navigationRef as any).navigate(ROUTES.ACTIVITY.DETAIL, {
        inviteToken: parsed.inviteToken,
      });
      return;
    }

    if (parsed.type === 'groupInvite' && parsed.groupInviteToken) {
      if (!session?.user) {
        if (allowStorePending) {
          await storePendingDeepLink(url);
        }
        Alert.alert('Sign in required', 'Log in to join this Rally.');
        return;
      }

      try {
        const { activityId, conversationId, groupId, joinedGame, joinGameError } =
          await joinGroupAndNextGame(parsed.groupInviteToken);

        if (joinGameError === 'full') {
          Alert.alert(
            'Joined Rally',
            "You're in the Rally. The next game is full — tap Join when a spot opens."
          );
        }

        if (conversationId && navigationRef.isReady()) {
          (navigationRef as any).navigate(ROUTES.CHAT.THREAD, {
            conversationId,
            activityId: activityId ?? undefined,
            groupId,
            title: PRODUCT_COPY.rallyChat,
          });
          return;
        }

        if (activityId && navigationRef.isReady()) {
          try {
            const gameConvoId = await ensureActivityGroupConversation(activityId);
            (navigationRef as any).navigate(ROUTES.CHAT.THREAD, {
              conversationId: gameConvoId,
              activityId,
            });
            return;
          } catch {
            // Joined the crew but couldn't open the room — fall back to a confirmation.
          }
        }

        if (joinedGame) {
          Alert.alert('Joined crew', "You're in! Your next game will show up in Chats.");
        } else if (!joinGameError) {
          Alert.alert('Joined crew', "You're in the crew. Open Chats when a game is scheduled.");
        }
      } catch (err: unknown) {
        Alert.alert(
          'Group invite',
          err instanceof Error ? err.message : 'Could not join group.'
        );
      }
    }
  } catch (error) {
    console.error('Error processing deep link:', error);
  }
}
