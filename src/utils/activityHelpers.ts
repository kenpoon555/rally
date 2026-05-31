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

export function canHostScheduleNextGame(
  activity: Pick<Activity, 'start_time' | 'duration' | 'status' | 'match_status'>,
  isHost: boolean
): boolean {
  if (!isHost || activity.status === 'cancelled') {
    return false;
  }
  return activity.match_status === 'finalized' || Date.now() >= gameEndMs(activity);
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
