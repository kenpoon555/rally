/**
 * Sport types and matching profiles.
 *
 * MVP launch: pickleball-only (`launchEnabled`). User-facing label: "game" (internal: activity).
 * Default scheduling: fixed time at a court; flexible matching is secondary.
 * See docs/sport-matching-profiles.md.
 */

export enum SportType {
  PICKLEBALL = 'Pickleball',
  BASKETBALL = 'Basketball',
  TENNIS = 'Tennis',
  BADMINTON = 'Badminton',
  RUNNING = 'Running',
  HIKING = 'Hiking',
}

/** Product matching archetypes; not all are exposed in UI at once. */
export type MatchingProfile = 'partnerFlex' | 'fastFixed' | 'groupDiscuss';

export type LocationStrictness = 'loose' | 'moderate' | 'strict';
export type TimeStrictness = 'loose' | 'moderate' | 'strict';

export interface SportMetadata {
  id: string;
  name: SportType;
  matchingProfile: MatchingProfile;
  /** When true, sport appears in Discover filters and Create Game pickers. */
  launchEnabled: boolean;
  minPlayers: number;
  locationStrictness: LocationStrictness;
  timeStrictness: TimeStrictness;
  /** Default create flow for this sport (fixed = set time now; flex = collect preferences). */
  defaultSchedulingMode: 'fixed' | 'flex';
  shortLabel?: string;
}

/** MVP default path: quick fixed games at a court. */
export const MVP_DEFAULT_SCHEDULING_MODE: 'fixed' | 'flex' = 'fixed';

export const SPORT_METADATA: Record<SportType, SportMetadata> = {
  [SportType.PICKLEBALL]: {
    id: 'pickleball',
    name: SportType.PICKLEBALL,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 1,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Pickleball',
  },
  [SportType.TENNIS]: {
    id: 'tennis',
    name: SportType.TENNIS,
    matchingProfile: 'partnerFlex',
    launchEnabled: false,
    minPlayers: 2,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'flex',
    shortLabel: 'Tennis',
  },
  [SportType.BADMINTON]: {
    id: 'badminton',
    name: SportType.BADMINTON,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Badminton',
  },
  [SportType.BASKETBALL]: {
    id: 'basketball',
    name: SportType.BASKETBALL,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    locationStrictness: 'strict',
    timeStrictness: 'strict',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Basketball',
  },
  [SportType.RUNNING]: {
    id: 'running',
    name: SportType.RUNNING,
    matchingProfile: 'fastFixed',
    launchEnabled: false,
    minPlayers: 1,
    locationStrictness: 'moderate',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Running',
  },
  [SportType.HIKING]: {
    id: 'hiking',
    name: SportType.HIKING,
    matchingProfile: 'partnerFlex',
    launchEnabled: false,
    minPlayers: 2,
    locationStrictness: 'loose',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'flex',
    shortLabel: 'Hiking',
  },
};

export const SPORT_TYPES = Object.values(SportType) as SportType[];

export const LAUNCH_SPORT_TYPES = SPORT_TYPES.filter(
  (s) => SPORT_METADATA[s].launchEnabled
);

export function getSportMetadata(sportName: string): SportMetadata | undefined {
  const match = SPORT_TYPES.find((s) => s === sportName);
  return match ? SPORT_METADATA[match] : undefined;
}

/** First launch-enabled sport (default UI selection). */
export function getDefaultLaunchSportName(): string {
  return LAUNCH_SPORT_TYPES[0] ?? SportType.PICKLEBALL;
}

/**
 * If the user prefers a launch-enabled sport, use it; otherwise default to pickleball.
 */
export function resolvePreferredSportForLaunch(preferred?: string | null): string {
  if (preferred && getSportMetadata(preferred)?.launchEnabled) {
    return preferred;
  }
  return getDefaultLaunchSportName();
}

/** User's default sport for Discover filter and Create Game prefill. */
export function resolveUserDefaultSport(preferred?: string | null): string {
  return resolvePreferredSportForLaunch(preferred);
}

/** User-facing strings for Activity Detail, keyed by sport `matchingProfile`. */
export interface ActivityDetailMatchingCopy {
  statusSchedulingDescriptor: string;
  statusDetailLine?: string;
  preferenceCardTitle: string;
  preferenceCardSubtitle?: string;
  submitPreferenceButtonLabel: string;
  finalizeMatchLabel: string;
  collectingDeadlineLabel: string;
}

export const ACTIVITY_DETAIL_COPY_BY_PROFILE: Record<
  MatchingProfile,
  ActivityDetailMatchingCopy
> = {
  partnerFlex: {
    statusSchedulingDescriptor: 'Flexible matching',
    statusDetailLine:
      'Players share availability; the host picks the best time after preferences close.',
    preferenceCardTitle: 'Share your availability',
    preferenceCardSubtitle:
      'Optional: earliest/latest start, location preference, and how strongly this time works for you.',
    submitPreferenceButtonLabel: 'Submit availability',
    finalizeMatchLabel: 'Finalize best time',
    collectingDeadlineLabel: 'Preferences close',
  },
  fastFixed: {
    statusSchedulingDescriptor: 'Fixed game time',
    statusDetailLine: 'The game time is set when the game is created.',
    preferenceCardTitle: 'Confirm your preferences',
    preferenceCardSubtitle:
      'If this game is still coordinating, lock in your slot preferences.',
    submitPreferenceButtonLabel: 'Submit preferences',
    finalizeMatchLabel: 'Finalize time',
    collectingDeadlineLabel: 'Respond by',
  },
  groupDiscuss: {
    statusSchedulingDescriptor: 'Group coordination',
    statusDetailLine: 'Use game chat to agree on time and place.',
    preferenceCardTitle: 'Your preferences',
    preferenceCardSubtitle: 'Share what works so the group can agree.',
    submitPreferenceButtonLabel: 'Submit preferences',
    finalizeMatchLabel: 'Finalize details',
    collectingDeadlineLabel: 'Deadline',
  },
};

export function resolveMatchingProfileForActivity(
  sportType: string | undefined,
  schedulingMode: 'fixed' | 'flex' | null | undefined
): MatchingProfile {
  const meta = sportType ? getSportMetadata(sportType) : undefined;
  if (meta) {
    return meta.matchingProfile;
  }
  if (schedulingMode === 'flex') {
    return 'partnerFlex';
  }
  return 'fastFixed';
}

export function getActivityDetailMatchingCopy(
  sportType: string | undefined,
  schedulingMode: 'fixed' | 'flex' | null | undefined
): ActivityDetailMatchingCopy {
  const profile = resolveMatchingProfileForActivity(sportType, schedulingMode);
  return ACTIVITY_DETAIL_COPY_BY_PROFILE[profile];
}

export const ACTIVITY_DURATIONS = [30, 60, 90] as const;
export type ActivityDuration = (typeof ACTIVITY_DURATIONS)[number];

export const ACTIVITY_VISIBILITY = ['friends', 'nearby', 'invite_only'] as const;
export type ActivityVisibility = (typeof ACTIVITY_VISIBILITY)[number];

/** Shown in Create Activity advanced settings (not invite-only — use Schedule next game). */
export const CREATE_ACTIVITY_VISIBILITY = ['friends', 'nearby'] as const;
