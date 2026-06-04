import { Activity, JoinRequest } from '../types/activity';
import { calculateDistance } from './distance';
import { isActivityListingActive, gameEndMs } from './activityExpiry';
import { GAME_CHAT_ARCHIVE_GRACE_MS } from '../constants/gameChat';

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

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m away`;
  return `${(meters / 1000).toFixed(1)} km away`;
};

export const getDistanceToActivity = (
  activity: Activity,
  userLocation: { latitude: number; longitude: number }
): number | null => {
  const coords = activity.location?.location?.coordinates;
  if (!coords) return null;
  const [lng, lat] = coords;
  return calculateDistance(userLocation, { latitude: lat, longitude: lng });
};

export const getApprovedParticipants = (activity: Activity): JoinRequest[] => {
  return (activity.join_requests || []).filter((r) => r.status === 'approved');
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
  if (friendIds.size === 0) {
    return false;
  }
  if (friendIds.has(activity.user_id)) {
    return true;
  }
  return getApprovedParticipants(activity).some((participant) => friendIds.has(participant.user_id));
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

  const targetTotal = 1 + Math.max(activity.missing_players ?? 1, 0);
  const approved = approvedParticipants.length + 1;
  const ready =
    1 + approvedParticipants.filter((participant) => participant.ready_at).length;

  const canFinalize =
    (approved >= targetTotal && ready >= targetTotal) ||
    (approved < targetTotal && ready >= approved);

  if (canFinalize) {
    return 'ready';
  }
  if (approved < targetTotal) {
    return 'needs_players';
  }
  return 'waiting_im_in';
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

    const aTonight = a.urgency_level === 'tonight' ? 1 : 0;
    const bTonight = b.urgency_level === 'tonight' ? 1 : 0;
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
  if (activity.match_status === 'finalized' || activity.match_status === 'cancelled') {
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
  activity: Pick<Activity, 'status' | 'match_status' | 'expires_at' | 'start_time' | 'scheduling_mode' | 'window_end'>
): string {
  if (activity.status === 'completed') {
    return 'Played';
  }
  if (activity.status === 'cancelled') {
    return 'Cancelled';
  }
  if (!isActivityListingActive(activity)) {
    return 'Expired';
  }
  if (activity.match_status === 'finalized') {
    return 'Finalized';
  }
  if (activity.match_status === 'collecting') {
    return 'Collecting';
  }
  return 'Open';
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

export function formatRosterSummary(activity: Activity): string {
  const approved = getApprovedParticipants(activity).length + 1;
  const open = activity.missing_players ?? 0;
  return `${approved} in · ${open} open`;
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
