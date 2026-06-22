import { Alert } from 'react-native';
import { ROUTES } from '../constants/routes';
import { PRODUCT_COPY } from '../constants/productCopy';
import { navigationRef } from './navigationRef';
import { parseAppDeepLink, ParsedDeepLink } from './deepLinking';
import { storePendingDeepLink } from '../services/pendingDeepLinkService';
import { joinGroupAndNextGame } from '../services/regularGroupService';
import { resolveActivityIdFromInviteToken } from '../services/activityService';
import { ensureActivityGroupConversation } from '../services/chatService';
import { supabase } from '../services/api/supabase';
import { trackProductEvent } from '../services/analyticsService';

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

async function navigateDeepLinkOrStore(
  url: string,
  name: string,
  params?: object,
  allowStorePending = true
): Promise<boolean> {
  const opened = await navigateDeepLink(name, params);
  if (!opened && allowStorePending) {
    await storePendingDeepLink(url);
  }
  return opened;
}

function trackInviteLinkOpened(parsed: ParsedDeepLink): void {
  const props: Record<string, unknown> = { link_type: parsed.type };
  if (parsed.activityId) {
    props.activity_id = parsed.activityId;
  }
  if (parsed.inviteToken) {
    props.invite_token_present = true;
  }
  if (parsed.groupInviteToken) {
    props.group_invite_token_present = true;
  }
  void trackProductEvent('invite_link_opened', props);
}

export async function processDeepLink(url: string, options?: { allowStorePending?: boolean }): Promise<void> {
  const allowStorePending = options?.allowStorePending !== false;

  try {
    const parsed = parseAppDeepLink(url);

    if (
      parsed.type === 'game' ||
      parsed.type === 'invite' ||
      parsed.type === 'hostInvite' ||
      parsed.type === 'groupInvite'
    ) {
      trackInviteLinkOpened(parsed);
    }

    if (parsed.type === 'unknown') {
      Alert.alert('Invalid invite', 'This invite link is not valid or has expired.');
      return;
    }

    if (parsed.type === 'sportLanding' && parsed.sportSlug) {
      await navigateDeepLinkOrStore(url, ROUTES.LANDING.SPORT, { sportSlug: parsed.sportSlug }, allowStorePending);
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
      await navigateDeepLinkOrStore(
        url,
        ROUTES.ACTIVITY.DETAIL,
        { activityId: parsed.activityId },
        allowStorePending
      );
      return;
    }

    if (parsed.type === 'hostInvite' && parsed.inviteToken) {
      await navigateDeepLinkOrStore(
        url,
        ROUTES.ACTIVITY.DETAIL,
        {
          inviteToken: parsed.inviteToken,
          hostInvite: true,
        },
        allowStorePending
      );
      return;
    }

    if (parsed.type === 'invite' && parsed.inviteToken) {
      try {
        const activityId = await resolveActivityIdFromInviteToken(parsed.inviteToken);
        if (!activityId) {
          Alert.alert('Invite link', 'This invite is invalid or expired.');
          return;
        }
        const opened = await navigateDeepLinkOrStore(
          url,
          ROUTES.ACTIVITY.DETAIL,
          { activityId },
          allowStorePending
        );
        if (!opened) {
          return;
        }
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
      await navigateDeepLinkOrStore(
        url,
        ROUTES.COACH_PARENT.PARENT_CLASS_INVITE,
        {
          inviteToken: parsed.classEnrollToken,
        },
        allowStorePending
      );
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
          const opened = await navigateDeepLinkOrStore(
            url,
            ROUTES.CHAT.THREAD,
            {
              conversationId,
              activityId: activityId ?? undefined,
              groupId,
              title: PRODUCT_COPY.rallyChat,
            },
            allowStorePending
          );
          if (opened) {
            return;
          }
        }

        if (activityId) {
          try {
            const gameConvoId = await ensureActivityGroupConversation(activityId);
            const opened = await navigateDeepLinkOrStore(
              url,
              ROUTES.CHAT.THREAD,
              {
                conversationId: gameConvoId,
                activityId,
              },
              allowStorePending
            );
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
