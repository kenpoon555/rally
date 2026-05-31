/**
 * Sport types and matching profiles.
 *
 * Beta: fixed-time games by default; host coordinates details in Game Room chat.
 * Launch set via `launchEnabled` in SPORT_METADATA.
 * See docs/sport-matching-profiles.md.
 */

export enum SportType {
  PICKLEBALL = 'Pickleball',
  BASKETBALL = 'Basketball',
  BADMINTON = 'Badminton',
  TENNIS = 'Tennis',
  VOLLEYBALL = 'Volleyball',
  SOCCER = 'Soccer',
  SQUASH = 'Squash',
  RACQUETBALL = 'Racquetball',
  TABLE_TENNIS = 'Table Tennis',
  ULTIMATE = 'Ultimate Frisbee',
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
  /** Typical total roster including host (drives default open spots). */
  defaultTotalPlayers: number;
  /** Hard to find partners without a crew — Rally's niche wedge. */
  partnerDependent?: boolean;
  locationStrictness: LocationStrictness;
  timeStrictness: TimeStrictness;
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
    defaultTotalPlayers: 4,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Pickleball',
  },
  [SportType.BASKETBALL]: {
    id: 'basketball',
    name: SportType.BASKETBALL,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 8,
    locationStrictness: 'strict',
    timeStrictness: 'strict',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Basketball',
  },
  [SportType.BADMINTON]: {
    id: 'badminton',
    name: SportType.BADMINTON,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 4,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Badminton',
  },
  [SportType.TENNIS]: {
    id: 'tennis',
    name: SportType.TENNIS,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 4,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Tennis',
  },
  [SportType.VOLLEYBALL]: {
    id: 'volleyball',
    name: SportType.VOLLEYBALL,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 4,
    defaultTotalPlayers: 12,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Volleyball',
  },
  [SportType.SOCCER]: {
    id: 'soccer',
    name: SportType.SOCCER,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 4,
    defaultTotalPlayers: 10,
    locationStrictness: 'moderate',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Soccer',
  },
  [SportType.SQUASH]: {
    id: 'squash',
    name: SportType.SQUASH,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 2,
    partnerDependent: true,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Squash',
  },
  [SportType.RACQUETBALL]: {
    id: 'racquetball',
    name: SportType.RACQUETBALL,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 2,
    partnerDependent: true,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Racquetball',
  },
  [SportType.TABLE_TENNIS]: {
    id: 'table_tennis',
    name: SportType.TABLE_TENNIS,
    matchingProfile: 'fastFixed',
    launchEnabled: true,
    minPlayers: 2,
    defaultTotalPlayers: 4,
    partnerDependent: true,
    locationStrictness: 'strict',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Table Tennis',
  },
  [SportType.ULTIMATE]: {
    id: 'ultimate',
    name: SportType.ULTIMATE,
    matchingProfile: 'groupDiscuss',
    launchEnabled: true,
    minPlayers: 6,
    defaultTotalPlayers: 14,
    partnerDependent: true,
    locationStrictness: 'moderate',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Ultimate',
  },
  [SportType.RUNNING]: {
    id: 'running',
    name: SportType.RUNNING,
    matchingProfile: 'fastFixed',
    launchEnabled: false,
    minPlayers: 1,
    defaultTotalPlayers: 2,
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
    defaultTotalPlayers: 4,
    partnerDependent: true,
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

export function resolvePreferredSportForLaunch(preferred?: string | null): string {
  if (preferred && getSportMetadata(preferred)?.launchEnabled) {
    return preferred;
  }
  return getDefaultLaunchSportName();
}

export function resolveUserDefaultSport(preferred?: string | null): string {
  return resolvePreferredSportForLaunch(preferred);
}

export function getDefaultTotalPlayersForSport(sportName: string): number {
  return getSportMetadata(sportName)?.defaultTotalPlayers ?? 2;
}

/** Open spots besides the host — stored as activities.missing_players. */
export function getDefaultOpenSpotsForSport(sportName: string): number {
  return Math.max(1, getDefaultTotalPlayersForSport(sportName) - 1);
}

/** @deprecated Use getDefaultOpenSpotsForSport */
export function getDefaultMissingPlayersForSport(sportName: string): number {
  return getDefaultOpenSpotsForSport(sportName);
}

export function openSpotsFromTotalPlayers(totalPlayers: number): number {
  return Math.max(0, totalPlayers - 1);
}

export function totalPlayersFromOpenSpots(openSpots: number): number {
  return Math.max(1, openSpots + 1);
}

export function getCreateGameSubtitle(sportName: string): string {
  const meta = getSportMetadata(sportName);
  const label = sportName.toLowerCase();
  if (meta?.locationStrictness === 'loose') {
    return `Host a ${label} meetup — set a time; pin the meet spot in chat.`;
  }
  if (meta?.partnerDependent) {
    return `Host a ${label} game — find your crew, then nail down court details in chat.`;
  }
  return `Host a ${label} game at a nearby court or field.`;
}

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
    statusDetailLine: 'Use game chat to agree on field, format, and meet spot.',
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

export const CREATE_ACTIVITY_VISIBILITY = ['friends', 'nearby'] as const;
