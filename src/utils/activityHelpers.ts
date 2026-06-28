import { Activity, JoinRequest } from '../types/activity';
import { parseGeographyCoordinates } from './activityLocationGeo';
import { calculateDistance } from './distance';
import { isActivityListingActive, gameEndMs, parseActivityTimestamp } from './activityExpiry';
import { GAME_CHAT_ARCHIVE_GRACE_MS } from '../constants/gameChat';
import { formatRosterExpectation } from '../constants/sports';

export type IntensityLevel = 'casual' | 'moderate' | 'intense';

export const INTENSITY_CONFIG: Record<IntensityLevel, { label: string; color: string }> = {
  casual:   { label: 'Casual',   color: '#34C759' },
  moderate: { label: 'Moderate', color: '#FF9500' },
  intense:  { label: 'Intense',  color: '#FF3B30' },
};

export const getIntensityFromDuration = (duration: number): IntensityLevel => {
  if (duration <= 45) return 'casual';
  if (duration <= 90) return 'moderate';
  return 'intense';
};

export const formatActivityTime = (startTime: string, duration: number): string => {
  const date = new Date(startTime);
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dayStr} · ${timeStr} · ${duration} min`;
};

/** Host-flagged "tonight" urgency — only while the game is still today and not over. */
export function isTonightUrgency(
  activity: Pick<Activity, 'urgency_level' | 'start_time' | 'duration' | 'status'>
): boolean {
  if (activity.urgency_level !== 'tonight') {
    return false;
  }
  if (isPastGameActivity(activity)) {
    return false;
  }
  if (!activity.start_time) {
    return false;
  }
  const startMs = parseActivityTimestamp(activity.start_time);
  if (!Number.isFinite(startMs)) {
    return false;
  }
  const start = new Date(startMs);
  const now = new Date();
  const sameCalendarDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();
  if (!sameCalendarDay) {
    return false;
  }
  const endMs = gameEndMs(activity);
  if (!Number.isFinite(endMs)) {
    return false;
  }
  return endMs >= Date.now();
}

export function isPastGameActivity(
  activity: Pick<Activity, 'status' | 'start_time' | 'duration'>
): boolean {
  if (activity.status === 'completed' || activity.status === 'cancelled') {
    return true;
  }
  if (!activity.start_time) {
    return false;
  }
  const endMs = gameEndMs(activity);
  if (Number.isFinite(endMs)) {
    return endMs < Date.now();
  }
  const startMs = parseActivityTimestamp(activity.start_time);
  return Number.isFinite(startMs) && startMs < Date.now();
}

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
};

export const getDistanceToActivity = (
  activity: Activity,
  userLocation: { latitude: number; longitude: number }
): number | null => {
  const parsed = parseGeographyCoordinates(activity.location?.location);
  if (!parsed) {
    return null;
  }
  const [lng, lat] = parsed;
  return calculateDistance(userLocation, { latitude: lat, longitude: lng });
};

export const getApprovedParticipants = (activity: Activity): JoinRequest[] => {
  return (activity.join_requests || []).filter((r) => r.status === 'approved');
};

/** Avatar row item for game cards. */
export type GameParticipantAvatar = {
  key: string;
  username: string;
  userId?: string;
  isHost?: boolean;
  isPending?: boolean;
};

/** Display names for game-card avatar rows (host first, then approved roster). */
export function getGameParticipantPreview(activity: Activity): {
  names: string[];
  players: GameParticipantAvatar[];
  total: number;
} {
  const players: GameParticipantAvatar[] = [];
  if (activity.user?.username?.trim()) {
    players.push({
      key: `host-${activity.user.id}`,
      username: activity.user.username.trim(),
      userId: activity.user.id,
      isHost: true,
    });
  }
  for (const req of sortApprovedRosterParticipants(getApprovedParticipants(activity))) {
    const name = req.user?.username?.trim();
    if (name && req.user_id !== activity.user_id) {
      players.push({
        key: req.id,
        username: name,
        userId: req.user?.id ?? req.user_id,
      });
    }
  }
  const names = players.map((player) => player.username);
  const total = Math.max(activity.player_count ?? 0, names.length, players.length > 0 ? 1 : 0);
  return { names, players, total };
};

/** Roster strip order: I'm in first, then earlier join requests first. */
export const sortApprovedRosterParticipants = (participants: JoinRequest[]): JoinRequest[] => {
  return [...participants].sort((a, b) => {
    const aReady = a.ready_at ? 1 : 0;
    const bReady = b.ready_at ? 1 : 0;
    if (bReady !== aReady) {
      return bReady - aReady;
    }
    const aJoin = new Date(a.requested_at).getTime();
    const bJoin = new Date(b.requested_at).getTime();
    return aJoin - bJoin;
  });
};

/** Next host if current host exits (ready first, join time asc). */
export const pickNextHostCandidate = (activity: Activity): JoinRequest | undefined => {
  const sorted = sortApprovedRosterParticipants(getApprovedParticipants(activity));
  return sorted[0];
};

export const getMyJoinRequest = (
  activity: Activity,
  userId: string | undefined
): JoinRequest | undefined => {
  if (!userId) {
    return undefined;
  }
  return (activity.join_requests || []).find((r) => r.user_id === userId);
};

/** Open spots from host-declared capacity (missing_players). */
export const activityHasOpenSpots = (activity: Activity): boolean => {
  return (activity.missing_players ?? 0) > 0;
};

export const isUserWaitlistedOnActivity = (
  activity: Activity,
  userId: string | undefined
): boolean => {
  return getMyJoinRequest(activity, userId)?.status === 'waitlisted';
};

/** True when a friend hosts or has an approved spot on the game. */
export function activityHasFriend(activity: Activity, friendIds: Set<string>): boolean {
  return getFriendsOnActivity(activity, friendIds).length > 0;
}

/** Friend usernames on roster (host + approved), for Discover card copy. */
export function getFriendsOnActivity(activity: Activity, friendIds: Set<string>): string[] {
  if (friendIds.size === 0) {
    return [];
  }
  const names: string[] = [];
  const hostName = activity.user?.username;
  if (hostName && friendIds.has(activity.user_id)) {
    names.push(hostName);
  }
  for (const participant of getApprovedParticipants(activity)) {
    const username = participant.user?.username;
    if (username && friendIds.has(participant.user_id) && !names.includes(username)) {
      names.push(username);
    }
  }
  return names;
}

/** Roster + ready counts for Discover cards (host counts as on roster; ready if locked or I'm in). */
export function getActivityRosterSummary(activity: Activity): {
  onRoster: number;
  capacity: number;
  readyCount: number;
} {
  const approved = getApprovedParticipants(activity);
  const onRoster = 1 + approved.length;
  const capacity = getActivityRosterMax(activity);
  const isFinalized = activity.match_status === 'finalized';
  const readyCount =
    1 +
    approved.filter((p) => isFinalized || Boolean(p.ready_at)).length;
  return { onRoster, capacity, readyCount };
}

/** Host may change time/court only before anyone joins or confirms I'm in. */
export function canHostEditGameSchedule(
  activity: Activity,
  approvedParticipants: { ready_at?: string | null }[]
): boolean {
  if (activity.status !== 'active') {
    return false;
  }
  if (activity.match_status === 'finalized') {
    return false;
  }
  if (approvedParticipants.length > 0) {
    return false;
  }
  if ((activity.player_count ?? 1) > 1) {
    return false;
  }
  return !approvedParticipants.some((participant) => Boolean(participant.ready_at));
}

/** Spots props for `GameListCard` / `MyGameListCard` from a user's game entry. */
export function getMyGameListCardSpots(activity: Activity): {
  rosterCount: number;
  capacityCount: number;
  openSpots: number;
} {
  const { onRoster } = getActivityRosterSummary(activity);
  const capacity = getActivityRosterMax(activity);
  return {
    rosterCount: onRoster,
    capacityCount: capacity,
    openSpots: Math.max(capacity - onRoster, 0),
  };
}

export type RosterFillDisplay = {
  filled: number;
  total: number;
  count: string;
};

export type RosterSeatCaptionTone = 'full' | 'open';

export function getRosterSeatCaption(
  filled: number,
  total: number
): { label: string; tone: RosterSeatCaptionTone } {
  const open = Math.max(total - filled, 0);
  if (open <= 0) {
    return { label: 'Full', tone: 'full' };
  }
  if (open === 1) {
    return { label: '1 spot open', tone: 'open' };
  }
  return { label: `${open} spots open`, tone: 'open' };
}

export type SpotsStateTone = 'recruiting' | 'open' | 'full';

/**
 * Single source of truth for the "spots" label on any surface (discover badge,
 * detail seat bar). State-aware so the same game reads the same everywhere
 * (T0 · 2026-06-27 — resolves discover "5 left" vs detail "7 spots open"):
 *
 * - **Below roster minimum** (game not yet viable): `"{missing} more to start"`
 * - **Viable, room left**: `"{open} spots left"`
 * - **Full**: `"Full"`
 *
 * All figures come from server fields (`missing_players`, `player_count`,
 * `roster_max`) so list rows (no loaded participants) and detail agree.
 */
export function getActivitySpotsState(
  activity: Pick<Activity, 'roster_min' | 'roster_max' | 'player_count' | 'missing_players' | 'match_status'>
): { label: string; compactLabel: string; tone: SpotsStateTone } {
  const missing = activity.missing_players ?? 0;
  if (missing > 0) {
    return { label: `${missing} more to start`, compactLabel: `${missing} to start`, tone: 'recruiting' };
  }
  const total = Math.max(getActivityRosterMax(activity), 1);
  const filled = activity.player_count ?? 1;
  const open = Math.max(total - filled, 0);
  if (open <= 0) {
    return { label: 'Full', compactLabel: 'Full', tone: 'full' };
  }
  return {
    label: open === 1 ? '1 spot left' : `${open} spots left`,
    compactLabel: `${open} left`,
    tone: 'open',
  };
}

/** Trailing pill on Play discover list cards. */
export function getGameListSpotsBadgeLabel(
  activity: Pick<Activity, 'roster_min' | 'missing_players' | 'player_count' | 'roster_max' | 'match_status'>,
  lockedWelcoming: boolean
): string {
  if (lockedWelcoming) {
    return 'Almost full';
  }
  return getActivitySpotsState(activity).compactLabel;
}

export function getRosterSeatCounts(
  activity: Pick<
    Activity,
    'roster_min' | 'roster_max' | 'player_count' | 'missing_players' | 'match_status'
  >,
  onRoster?: number
): { filled: number; total: number } {
  const filled = onRoster ?? activity.player_count ?? 1;
  const total = Math.max(getActivityRosterMax(activity), 1);
  return { filled, total };
}

/** Compact roster fraction for meta lines (no "to lock" copy). */
export function formatRosterFillDisplay(
  activity: Pick<
    Activity,
    'roster_min' | 'roster_max' | 'player_count' | 'missing_players' | 'match_status'
  >,
  onRoster?: number
): RosterFillDisplay {
  const { filled, total } = getRosterSeatCounts(activity, onRoster);
  const { label } = getRosterSeatCaption(filled, total);
  return { filled, total, count: label };
}

/** One-line roster label for list meta rows. */
export function formatGameCardRosterLine(
  activity: Pick<
    Activity,
    'roster_min' | 'roster_max' | 'player_count' | 'missing_players' | 'match_status'
  >,
  onRoster?: number
): string {
  return formatRosterFillDisplay(activity, onRoster).count;
}

export function formatRosterSummary(activity: Activity): string {
  const { onRoster } = getActivityRosterSummary(activity);
  return formatGameCardRosterLine(activity, onRoster);
}

export type ParticipantReadyState = 'ready' | 'waiting' | 'none';

/** Host is always ready; waiting only applies before the roster is locked. */
export function getParticipantReadyState(
  params: {
    isHost?: boolean;
    readyAt?: string | null;
    isFinalized?: boolean;
    isApproved?: boolean;
  }
): ParticipantReadyState {
  if (params.isFinalized) {
    return 'none';
  }
  if (params.isHost || params.readyAt) {
    return 'ready';
  }
  if (params.isApproved) {
    return 'waiting';
  }
  return 'none';
}

export function countReadyParticipants(
  activity: Activity,
  approvedParticipants: JoinRequest[] = getApprovedParticipants(activity)
): { readyCount: number; rosterCount: number } {
  const readyCount =
    approvedParticipants.filter((participant) => participant.ready_at).length + 1;
  return { readyCount, rosterCount: approvedParticipants.length + 1 };
}

/** Mirrors `finalize_game_commitment` readiness rules (host + approved joiners). */
export type HostLockReadiness = 'ready' | 'waiting_im_in' | 'needs_players';

export function getHostLockReadiness(
  activity: Activity,
  approvedParticipants: JoinRequest[] = getApprovedParticipants(activity)
): HostLockReadiness {
  /** Host alone — can finalize in DB but should not show "ready to lock" in UI. */
  if (approvedParticipants.length === 0) {
    return 'needs_players';
  }

  const lockMin = getActivityRosterMin(activity);
  const approved = approvedParticipants.length + 1;
  const ready =
    1 + approvedParticipants.filter((participant) => participant.ready_at).length;

  const canFinalize = approved >= lockMin && ready >= approved;

  if (canFinalize) {
    return 'ready';
  }
  if (approved < lockMin) {
    return 'needs_players';
  }
  return 'waiting_im_in';
}

export function getActivityRosterMax(
  activity: Pick<Activity, 'roster_max' | 'player_count' | 'missing_players'>
): number {
  if (activity.roster_max != null && activity.roster_max > 0) {
    return activity.roster_max;
  }
  return (activity.player_count ?? 1) + Math.max(activity.missing_players ?? 0, 0);
}

export function getActivityRosterMin(
  activity: Pick<Activity, 'roster_min' | 'roster_max' | 'player_count' | 'missing_players'>
): number {
  if (activity.roster_min != null && activity.roster_min > 0) {
    return activity.roster_min;
  }
  return getActivityRosterMax(activity);
}

export function formatRosterExpectationForActivity(
  activity: Pick<Activity, 'roster_min' | 'roster_max' | 'player_count' | 'missing_players'>
): string | null {
  const max = getActivityRosterMax(activity);
  const min = getActivityRosterMin(activity);
  if (min >= max && activity.roster_min == null && activity.roster_max == null) {
    return null;
  }
  return formatRosterExpectation(min, max);
}

/** Friend-connected games first, then open spots / tonight, then distance. */
export function sortDiscoverFeedActivities(
  activities: Activity[],
  userLocation?: { latitude: number; longitude: number } | null,
  friendIds: Set<string> = new Set(),
  options?: { highlightOpenSpots?: boolean }
): Activity[] {
  return [...activities].sort((a, b) => {
    const aFriend = activityHasFriend(a, friendIds) ? 1 : 0;
    const bFriend = activityHasFriend(b, friendIds) ? 1 : 0;
    if (aFriend !== bFriend) {
      return bFriend - aFriend;
    }

    if (options?.highlightOpenSpots) {
      const aOpen = (a.missing_players ?? 0) > 0 ? 1 : 0;
      const bOpen = (b.missing_players ?? 0) > 0 ? 1 : 0;
      if (aOpen !== bOpen) {
        return bOpen - aOpen;
      }
    }

    const aTonight = isTonightUrgency(a) ? 1 : 0;
    const bTonight = isTonightUrgency(b) ? 1 : 0;
    if (aTonight !== bTonight) {
      return bTonight - aTonight;
    }

    if (userLocation) {
      const da = getDistanceToActivity(a, userLocation);
      const db = getDistanceToActivity(b, userLocation);
      if (da == null && db == null) {
        return 0;
      }
      if (da == null) {
        return 1;
      }
      if (db == null) {
        return -1;
      }
      if (da !== db) {
        return da - db;
      }
    }

    return 0;
  });
}

/** Discover is for finding open games — hide games you're already in or that are locked. */
export function shouldShowInDiscoverFeed(activity: Activity, userId?: string): boolean {
  if (activity.visibility === 'invite_only') {
    return false;
  }
  if (activity.match_status === 'cancelled') {
    return false;
  }
  if (activity.match_status === 'finalized' && (activity.missing_players ?? 0) <= 0) {
    return false;
  }
  if (!userId) {
    return true;
  }
  if (activity.user_id === userId) {
    return false;
  }
  const mine = (activity.join_requests || []).find((r) => r.user_id === userId);
  if (mine?.status === 'approved') {
    return false;
  }
  return true;
}

/** User-facing label for a game row (Played / Open / Expired, etc.). */
export function getGameStatusLabel(
  activity: Pick<
    Activity,
    'status' | 'match_status' | 'expires_at' | 'start_time' | 'scheduling_mode' | 'window_end' | 'duration'
  >
): string {
  if (activity.status === 'cancelled') {
    return 'Cancelled';
  }

  const playWindowEnded =
    activity.status === 'completed' ||
    !isActivityListingActive(activity) ||
    Date.now() >= gameEndMs(activity);

  if (activity.match_status === 'finalized') {
    if (playWindowEnded) {
      return 'Expired';
    }
    return 'Finalized';
  }

  if (playWindowEnded) {
    return 'Expired';
  }

  if (activity.match_status === 'collecting') {
    return 'Collecting';
  }
  return 'Open';
}

/** Play window ended — roster locked, no further roster changes. */
export function isExpiredUnlockedGame(
  activity: Pick<
    Activity,
    'status' | 'match_status' | 'expires_at' | 'start_time' | 'scheduling_mode' | 'window_end' | 'duration'
  >
): boolean {
  return getGameStatusLabel(activity) === 'Expired';
}

/** Play window has ended — post-game chat / schedule next game. */
export function isPostGameActivity(
  activity: Pick<Activity, 'status' | 'start_time' | 'duration'>
): boolean {
  if (activity.status === 'cancelled') {
    return false;
  }
  return isPastGameActivity(activity);
}

/** When this game chat becomes read-only (play end + grace). */
export function getGameChatArchiveAtMs(
  activity: Pick<Activity, 'start_time' | 'duration'>
): number {
  return gameEndMs(activity) + GAME_CHAT_ARCHIVE_GRACE_MS;
}

/** Post-game grace: chat stays open so players can plan the next game. */
export function isGameChatInPostGameGrace(
  activity: Pick<Activity, 'start_time' | 'duration'>
): boolean {
  const now = Date.now();
  const playEnd = gameEndMs(activity);
  return now >= playEnd && now < getGameChatArchiveAtMs(activity);
}

/** Archived after grace — not for cost; keeps old lobbies from feeling like live coordination. */
export function isGameChatReadOnly(
  activity: Pick<Activity, 'start_time' | 'duration'>
): boolean {
  return Date.now() >= getGameChatArchiveAtMs(activity);
}

/** @deprecated RSVP removed — use needsConfirmPlaying */
export function shouldShowGameRsvp(
  _activity: Pick<Activity, 'regular_group_id' | 'series_id' | 'match_status' | 'status'>
): boolean {
  return false;
}

/** Show home nudge when on crew game roster but not confirmed in yet. */
export function needsConfirmPlaying(activity: Activity, userId?: string): boolean {
  if (!userId || !activity.regular_group_id) {
    return false;
  }
  if (activity.status === 'cancelled' || activity.match_status === 'finalized') {
    return false;
  }
  if (activity.user_id === userId) {
    return false;
  }
  const approved = (activity.join_requests || []).find(
    (jr) => jr.user_id === userId && jr.status === 'approved'
  );
  if (!approved) {
    return false;
  }
  return !approved.ready_at;
}

/** @deprecated */
export function formatGroupRsvpSummary(activity: Pick<Activity, 'rsvps'>): string {
  return formatRosterSummary(activity as Activity);
}

/** @deprecated */
export function getMyRsvpStatus(
  _activity: Pick<Activity, 'rsvps'>,
  _userId?: string
): string | null {
  return null;
}

export function canHostScheduleNextGame(
  activity: Pick<Activity, 'start_time' | 'duration' | 'status' | 'match_status'>,
  isHost: boolean
): boolean {
  if (!isHost || activity.status === 'cancelled') {
    return false;
  }
  return activity.match_status === 'finalized' || Date.now() >= gameEndMs(activity);
}

/** Any Rally member can post a new session; they become host of that game. */
export function canMemberScheduleRallyGame(
  activity: Pick<Activity, 'status' | 'regular_group_id'>,
  isGroupMember: boolean
): boolean {
  return Boolean(
    activity.regular_group_id && isGroupMember && activity.status !== 'cancelled'
  );
}

export function getActivityOpenSpots(
  activity: Pick<Activity, 'missing_players'>
): number {
  return Math.max(0, activity.missing_players ?? 0);
}

export function getActivityTotalSpots(
  activity: Pick<Activity, 'player_count' | 'missing_players'>
): number {
  return (activity.player_count ?? 1) + getActivityOpenSpots(activity);
}

/**
 * Viewer's personal relationship to a game, for the discover card chip (taste-tier6 J4).
 * hosting → confirmed (ready) → joined (approved) → waitlist. Null when unrelated.
 */
export function getViewerGameState(
  activity: Activity,
  userId?: string
): 'hosting' | 'confirmed' | 'joined' | 'waitlist' | null {
  if (!userId) {
    return null;
  }
  if (activity.user_id === userId) {
    return 'hosting';
  }
  const mine = (activity.join_requests || []).find((jr) => jr.user_id === userId);
  if (!mine) {
    return null;
  }
  if (mine.status === 'waitlisted') {
    return 'waitlist';
  }
  if (mine.status === 'approved') {
    return activity.match_status === 'finalized' || mine.ready_at ? 'confirmed' : 'joined';
  }
  return null;
}

/** Nearest games first; activities without coordinates sort to the end. */
export const sortActivitiesByDistance = (
  activities: Activity[],
  userLocation?: { latitude: number; longitude: number } | null
): Activity[] => {
  if (!userLocation) {
    return activities;
  }
  return [...activities].sort((a, b) => {
    const da = getDistanceToActivity(a, userLocation);
    const db = getDistanceToActivity(b, userLocation);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
};
