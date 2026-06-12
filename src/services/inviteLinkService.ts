import { APP_SCHEME } from '../navigation/deepLinking';
import { getSupabaseFunctionsBaseUrl } from '../constants/appLinks';
import { activityCourtName, activityGameName } from '../constants/playIntent';
import { Activity } from '../types/activity';

export type GameInviteLinkKind = 'view' | 'host';

function functionsBase(): string | null {
  return getSupabaseFunctionsBaseUrl();
}

function buildWebInviteUrl(params: Record<string, string>): string {
  const base = functionsBase();
  const query = new URLSearchParams(params).toString();
  if (base) {
    return `${base}/game-invite?${query}`;
  }
  return buildAppInviteUrl(params);
}

function buildAppInviteUrl(params: Record<string, string>): string {
  if (params.host === '1' && params.token) {
    return `${APP_SCHEME}://host-invite/${params.token}`;
  }
  if (params.activity) {
    return `${APP_SCHEME}://game/${params.activity}`;
  }
  if (params.token) {
    return `${APP_SCHEME}://invite/${params.token}`;
  }
  return `${APP_SCHEME}://home`;
}

/** Public share — lands on game card; recipient requests to join. */
export function buildGameShareUrl(activityId: string): string {
  return buildWebInviteUrl({ activity: activityId });
}

/** Host share — recipient joins immediately when spots are open. */
export function buildHostGameInviteUrl(inviteToken: string): string {
  return buildWebInviteUrl({ token: inviteToken, host: '1' });
}

export function buildGameShareMessage(activity: Activity): string {
  const headline = activityGameName(activity);
  const court = activityCourtName(activity);
  const url = buildGameShareUrl(activity.id);
  return `Join my ${activity.sport_type} game "${headline}" at ${court} on Rally — request to join: ${url}`;
}

export function buildHostGameInviteMessage(activity: Activity): string {
  const headline = activityGameName(activity);
  const court = activityCourtName(activity);
  const token = activity.invite_token;
  if (!token) {
    return buildGameShareMessage(activity);
  }
  const url = buildHostGameInviteUrl(token);
  return `You're invited to my ${activity.sport_type} game "${headline}" at ${court} on Rally — tap to join: ${url}`;
}
