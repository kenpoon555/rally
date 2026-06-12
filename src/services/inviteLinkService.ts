import { Share } from 'react-native';
import { APP_SCHEME, buildRegularGroupInviteUrl } from '../navigation/deepLinking';
import { getSupabaseFunctionsBaseUrl } from '../constants/appLinks';
import { activityCourtName, activityGameName } from '../constants/playIntent';
import { Activity } from '../types/activity';
import { RegularGroup } from '../types/regularGroup';
import { ShareMode } from '../config/gameCardLayouts';

export type GameInviteLinkKind = 'view' | 'host';
export type InviteKind = 'gameHost' | 'gamePublic' | 'rallyGroup';

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

/** Single entry point for game invite copy — use everywhere instead of inline ternaries. */
export function buildGameInviteMessage(
  activity: Activity,
  options: { asHost: boolean }
): string {
  return options.asHost ? buildHostGameInviteMessage(activity) : buildGameShareMessage(activity);
}

export function buildGameInviteMessageFromShareMode(
  activity: Activity,
  shareMode: ShareMode,
  options?: { isHost?: boolean }
): string {
  if (shareMode === 'none') {
    return buildGameShareMessage(activity);
  }
  const asHost = shareMode === 'host' || Boolean(options?.isHost);
  return buildGameInviteMessage(activity, { asHost });
}

export async function shareGameInvite(
  activity: Activity,
  options: { asHost: boolean }
): Promise<void> {
  const message = buildGameInviteMessage(activity, options);
  await Share.share({ message });
}

function buildWebRallyInviteUrl(inviteToken: string): string {
  const base = functionsBase();
  if (base) {
    return `${base}/rally-invite?token=${encodeURIComponent(inviteToken)}`;
  }
  return buildRegularGroupInviteUrl(inviteToken);
}

export function buildRallyGroupInviteUrl(inviteToken: string): string {
  return buildWebRallyInviteUrl(inviteToken);
}

export function buildRallyGroupInviteMessage(group: Pick<RegularGroup, 'name' | 'sport_type' | 'invite_token'>): string {
  const url = buildRallyGroupInviteUrl(group.invite_token);
  return `Join our ${group.sport_type} Rally "${group.name}" on Rally — one tap to get in: ${url}`;
}

export async function shareRallyGroupInvite(
  group: Pick<RegularGroup, 'name' | 'sport_type' | 'invite_token'>
): Promise<void> {
  const message = buildRallyGroupInviteMessage(group);
  const url = buildRallyGroupInviteUrl(group.invite_token);
  await Share.share({ message, url });
}
