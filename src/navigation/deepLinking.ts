import { LinkingOptions } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';

export const APP_SCHEME = 'rallyapp';

export const linking: LinkingOptions<Record<string, object | undefined>> = {
  prefixes: [`${APP_SCHEME}://`],
  config: {
    screens: {
      MainTabs: {
        screens: {
          [ROUTES.CHAT.TAB]: 'chats',
          [ROUTES.HOME.MAIN]: 'discover',
          [ROUTES.MY_GAMES.TAB]: 'games',
        },
      },
      [ROUTES.ACTIVITY.DETAIL]: 'game/:activityId',
      [ROUTES.ACTIVITY.CREATE]: 'create',
      [ROUTES.HOME.MAP]: 'courts/map',
    },
  },
};

export function buildGameInviteUrl(inviteToken: string): string {
  return `${APP_SCHEME}://invite/${inviteToken}`;
}

export function buildGameActivityUrl(activityId: string): string {
  return `${APP_SCHEME}://game/${activityId}`;
}

/** Parse rallyapp://game/:id, rallyapp://invite/:token, rallyapp://auth/callback */
export function parseAppDeepLink(url: string): {
  type: 'auth' | 'game' | 'invite' | 'unknown';
  activityId?: string;
  inviteToken?: string;
} {
  try {
    const normalized = url.trim();
    if (normalized.includes('auth/callback')) {
      return { type: 'auth' };
    }

    const inviteMatch = normalized.match(/invite\/([0-9a-f-]{36})/i);
    if (inviteMatch) {
      return { type: 'invite', inviteToken: inviteMatch[1] };
    }

    const gameMatch = normalized.match(/game\/([0-9a-f-]{36})/i);
    if (gameMatch) {
      return { type: 'game', activityId: gameMatch[1] };
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
