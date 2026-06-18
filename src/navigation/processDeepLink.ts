import { Alert } from 'react-native';
import { ROUTES } from '../constants/routes';
import { PRODUCT_COPY } from '../constants/productCopy';
import { navigationRef } from './navigationRef';
import { parseAppDeepLink } from './deepLinking';
import { storePendingDeepLink } from '../services/pendingDeepLinkService';
import { joinGroupAndNextGame } from '../services/regularGroupService';
import { resolveActivityIdFromInviteToken } from '../services/activityService';
import { ensureActivityGroupConversation } from '../services/chatService';
import { supabase } from '../services/api/supabase';

const NAV_READY_POLL_MS = 50;
const NAV_READY_TIMEOUT_MS = 8000;

async function waitForNavigationReady(): Promise<boolean> {
  if (navigationRef.isReady()) {
    return true;
  }
  const deadline = Date.now() + NAV_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, NAV_READY_POLL_MS));
    if (navigationRef.isReady()) {
      return true;
    }
  }
  return navigationRef.isReady();
}

async function navigateDeepLink(name: string, params?: object): Promise<boolean> {
  if (!(await waitForNavigationReady())) {
    return false;
  }
  (navigationRef as any).navigate(name, params);
  return true;
}

export async function processDeepLink(url: string, options?: { allowStorePending?: boolean }): Promise<void> {
  const allowStorePending = options?.allowStorePending !== false;

  try {
    const parsed = parseAppDeepLink(url);

    if (parsed.type === 'unknown') {
      Alert.alert('Invalid invite', 'This invite link is not valid or has expired.');
      return;
    }

    if (parsed.type === 'sportLanding' && parsed.sportSlug) {
      await navigateDeepLink(ROUTES.LANDING.SPORT, { sportSlug: parsed.sportSlug });
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

    if (parsed.type === 'game' && parsed.activityId) {
      await navigateDeepLink(ROUTES.ACTIVITY.DETAIL, { activityId: parsed.activityId });
      return;
    }

    if (parsed.type === 'hostInvite' && parsed.inviteToken) {
      await navigateDeepLink(ROUTES.ACTIVITY.DETAIL, {
        inviteToken: parsed.inviteToken,
        hostInvite: true,
      });
      return;
    }

    if (parsed.type === 'invite' && parsed.inviteToken) {
      try {
        const activityId = await resolveActivityIdFromInviteToken(parsed.inviteToken);
        if (!activityId) {
          Alert.alert('Invite link', 'This invite is invalid or expired.');
          return;
        }
        await navigateDeepLink(ROUTES.ACTIVITY.DETAIL, { activityId });
      } catch (err: unknown) {
        Alert.alert(
          'Invite link',
          err instanceof Error ? err.message : 'Could not open this invite.'
        );
      }
      return;
    }

    if (parsed.type === 'classEnroll' && parsed.classEnrollToken) {
      if (!session?.user) {
        if (allowStorePending) {
          await storePendingDeepLink(url);
        }
        Alert.alert('Sign in required', 'Log in as a parent or guardian to enroll a student.');
        return;
      }
      await navigateDeepLink(ROUTES.COACH_PARENT.PARENT_CLASS_INVITE, {
        inviteToken: parsed.classEnrollToken,
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

        if (conversationId) {
          const opened = await navigateDeepLink(ROUTES.CHAT.THREAD, {
            conversationId,
            activityId: activityId ?? undefined,
            groupId,
            title: PRODUCT_COPY.rallyChat,
          });
          if (opened) {
            return;
          }
        }

        if (activityId) {
          try {
            const gameConvoId = await ensureActivityGroupConversation(activityId);
            const opened = await navigateDeepLink(ROUTES.CHAT.THREAD, {
              conversationId: gameConvoId,
              activityId,
            });
            if (opened) {
              return;
            }
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
