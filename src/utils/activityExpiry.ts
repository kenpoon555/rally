import { ActivitySchedulingMode } from '../types/activity';

/**
 * Parse PostgREST timestamptz strings reliably on Hermes/iOS.
 * Supabase often returns "2026-05-31 03:34:00+00" (space, short offset) which
 * some JS engines reject while others accept.
 */
export function parseActivityTimestamp(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return NaN;
  }

  let candidate = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  if (/\+\d{2}$/.test(candidate)) {
    candidate = `${candidate}:00`;
  }
  if (candidate.endsWith('+00:00')) {
    candidate = candidate.replace('+00:00', 'Z');
  }

  let ms = new Date(candidate).getTime();
  if (Number.isFinite(ms)) {
    return ms;
  }

  ms = new Date(trimmed).getTime();
  return ms;
}

/**
 * Default listing expiry = scheduled start (fixed) or preference window end (flex).
 */
export function defaultExpiresAt(params: {
  scheduling_mode: ActivitySchedulingMode;
  start_time: string;
  window_end?: string | null;
}): string {
  if (params.scheduling_mode === 'flex' && params.window_end) {
    return params.window_end;
  }
  return params.start_time;
}

export function isActivityListingActive(activity: {
  status: string;
  expires_at?: string | null;
  start_time: string;
  scheduling_mode?: ActivitySchedulingMode | null;
  window_end?: string | null;
}): boolean {
  if (activity.status !== 'active') {
    return false;
  }
  const now = Date.now();
  if (activity.expires_at) {
    return parseActivityTimestamp(activity.expires_at) >= now;
  }
  const fallbackEnd =
    activity.scheduling_mode === 'flex' && activity.window_end
      ? activity.window_end
      : activity.start_time;
  return parseActivityTimestamp(fallbackEnd) >= now;
}

/** Wait this long after scheduled game end before prompting reviews. */
export const REVIEW_DELAY_MS = 2 * 60 * 60 * 1000;

export function gameEndMs(activity: { start_time: string; duration?: number | null }): number {
  const durationMinutes = activity.duration ?? 60;
  return parseActivityTimestamp(activity.start_time) + durationMinutes * 60 * 1000;
}

export function isReviewWindowOpen(activity: {
  status: string;
  start_time: string;
  duration?: number | null;
  expires_at?: string | null;
  scheduling_mode?: ActivitySchedulingMode | null;
  window_end?: string | null;
}): boolean {
  const listingEnded =
    activity.status === 'completed' ||
    activity.status === 'cancelled' ||
    !isActivityListingActive(activity);

  if (!listingEnded) {
    return false;
  }
  return Date.now() >= gameEndMs(activity) + REVIEW_DELAY_MS;
}
