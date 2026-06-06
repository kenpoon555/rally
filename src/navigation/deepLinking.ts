import { LinkingOptions } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';

export const APP_SCHEME = 'rallyapp';

export const linking: LinkingOptions<Record<string, object | undefined>> = {
  prefixes: [`${APP_SCHEME}://`],
  config: {
    screens: {
      MainTabs: {
        screens: {
          [ROUTES.HOME.DYNAMIC]: 'home',
          [ROUTES.HOME.MAIN]: 'discover',
          [ROUTES.CHAT.TAB]: 'chats',
          [ROUTES.PROFILE.MAIN]: 'profile',
        },
      },
      [ROUTES.MY_GAMES.TAB]: 'games',
      [ROUTES.FRIENDS.LIST]: 'friends',
      [ROUTES.REGULAR_GROUP.CREW]: 'crew/:groupId',
      [ROUTES.ACTIVITY.DETAIL]: 'game/:activityId',
      [ROUTES.ACTIVITY.CREATE]: 'create',
      [ROUTES.LANDING.SPORT]: 'la/:sportSlug',
    },
  },
};

export function buildGameInviteUrl(inviteToken: string): string {
  return `${APP_SCHEME}://invite/${inviteToken}`;
}

export function buildRegularGroupInviteUrl(inviteToken: string): string {
  return `${APP_SCHEME}://group-invite/${inviteToken}`;
}

export function buildGameActivityUrl(activityId: string): string {
  return `${APP_SCHEME}://game/${activityId}`;
}

export function buildSportLandingUrl(sportSlug: string): string {
  return `${APP_SCHEME}://la/${sportSlug.toLowerCase()}`;
}

/** Parse rallyapp://game/:id, rallyapp://invite/:token, rallyapp://auth/callback */
export function parseAppDeepLink(url: string): {
  type: 'auth' | 'game' | 'invite' | 'groupInvite' | 'sportLanding' | 'unknown';
  activityId?: string;
  inviteToken?: string;
  groupInviteToken?: string;
  sportSlug?: string;
} {
  try {
    const normalized = url.trim();
    if (normalized.includes('auth/callback')) {
      return { type: 'auth' };
    }

    const groupInviteMatch = normalized.match(/group-invite\/([0-9a-f-]{36})/i);
    if (groupInviteMatch) {
      return { type: 'groupInvite', groupInviteToken: groupInviteMatch[1] };
    }

    const inviteMatch = normalized.match(/invite\/([0-9a-f-]{36})/i);
    if (inviteMatch) {
      return { type: 'invite', inviteToken: inviteMatch[1] };
    }

    const gameMatch = normalized.match(/game\/([0-9a-f-]{36})/i);
    if (gameMatch) {
      return { type: 'game', activityId: gameMatch[1] };
    }

    const landingMatch = normalized.match(/la\/([a-z]+)/i);
    if (landingMatch) {
      return { type: 'sportLanding', sportSlug: landingMatch[1].toLowerCase() };
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}

export function navigateGameDeepLink(
  navigate: (name: string, params?: object) => void,
  parsed: ReturnType<typeof parseAppDeepLink>
): void {
  if (parsed.type === 'game' && parsed.activityId) {
    navigate(ROUTES.ACTIVITY.DETAIL, { activityId: parsed.activityId });
    return;
  }
  if (parsed.type === 'invite' && parsed.inviteToken) {
    navigate(ROUTES.ACTIVITY.DETAIL, { inviteToken: parsed.inviteToken });
  }
}
