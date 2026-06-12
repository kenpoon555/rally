import { LinkingOptions } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';
import { getSupabaseFunctionsBaseUrl } from '../constants/appLinks';

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

/** @deprecated Use buildHostGameInviteUrl from inviteLinkService for share sheets. */
export function buildGameInviteUrl(inviteToken: string): string {
  return `${APP_SCHEME}://host-invite/${inviteToken}`;
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

export type ParsedDeepLink = {
  type: 'auth' | 'game' | 'invite' | 'hostInvite' | 'groupInvite' | 'sportLanding' | 'unknown';
  activityId?: string;
  inviteToken?: string;
  groupInviteToken?: string;
  sportSlug?: string;
};

const UUID_PATTERN = '[0-9a-f-]{36}';

function parseInviteWebUrl(url: string): ParsedDeepLink | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;

    if (path.includes('/functions/v1/rally-invite')) {
      const inviteToken = parsed.searchParams.get('token') || undefined;
      if (inviteToken) {
        return { type: 'groupInvite', groupInviteToken: inviteToken };
      }
      return null;
    }

    if (!path.includes('/functions/v1/game-invite')) {
      return null;
    }

    const activityId = parsed.searchParams.get('activity') || undefined;
    const inviteToken = parsed.searchParams.get('token') || undefined;
    const isHost = parsed.searchParams.get('host') === '1';

    if (isHost && inviteToken) {
      return { type: 'hostInvite', inviteToken };
    }
    if (activityId) {
      return { type: 'game', activityId };
    }
    if (inviteToken) {
      return { type: 'invite', inviteToken };
    }
    return null;
  } catch {
    return null;
  }
}

/** Parse rallyapp:// and HTTPS game-invite URLs. */
export function parseAppDeepLink(url: string): ParsedDeepLink {
  try {
    const normalized = url.trim();
    if (normalized.includes('auth/callback')) {
      return { type: 'auth' };
    }

    const webInvite = parseInviteWebUrl(normalized);
    if (webInvite) {
      return webInvite;
    }

    const groupInviteMatch = normalized.match(new RegExp(`group-invite/(${UUID_PATTERN})`, 'i'));
    if (groupInviteMatch) {
      return { type: 'groupInvite', groupInviteToken: groupInviteMatch[1] };
    }

    const hostInviteMatch = normalized.match(new RegExp(`host-invite/(${UUID_PATTERN})`, 'i'));
    if (hostInviteMatch) {
      return { type: 'hostInvite', inviteToken: hostInviteMatch[1] };
    }

    const inviteMatch = normalized.match(new RegExp(`invite/(${UUID_PATTERN})`, 'i'));
    if (inviteMatch) {
      return { type: 'invite', inviteToken: inviteMatch[1] };
    }

    const gameMatch = normalized.match(new RegExp(`game/(${UUID_PATTERN})`, 'i'));
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
  parsed: ParsedDeepLink
): void {
  if (parsed.type === 'game' && parsed.activityId) {
    navigate(ROUTES.ACTIVITY.DETAIL, { activityId: parsed.activityId });
    return;
  }
  if (parsed.type === 'hostInvite' && parsed.inviteToken) {
    navigate(ROUTES.ACTIVITY.DETAIL, {
      inviteToken: parsed.inviteToken,
      hostInvite: true,
    });
    return;
  }
  if (parsed.type === 'invite' && parsed.inviteToken) {
    navigate(ROUTES.ACTIVITY.DETAIL, { inviteToken: parsed.inviteToken });
  }
}
