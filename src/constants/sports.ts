/**
 * Sport types and matching profiles.
 *
 * Beta: fixed-time games by default; host coordinates details in Game Room chat.
 * Launch set via `launchEnabled` in SPORT_METADATA.
 * See docs/sport-matching-profiles.md.
 */

import { CONFIG } from './config';

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
  WORKOUT = 'Workout',
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
  /** Mini round-robin tournaments in Rally crew screens (doubles-style sports only). */
  miniTournamentEnabled?: boolean;
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
    miniTournamentEnabled: false,
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
    miniTournamentEnabled: false,
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
    miniTournamentEnabled: false,
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
    launchEnabled: true,
    miniTournamentEnabled: false,
    minPlayers: 1,
    defaultTotalPlayers: 6,
    locationStrictness: 'loose',
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
  [SportType.WORKOUT]: {
    id: 'workout',
    name: SportType.WORKOUT,
    matchingProfile: 'groupDiscuss',
    launchEnabled: false,
    miniTournamentEnabled: false,
    minPlayers: 2,
    defaultTotalPlayers: 8,
    locationStrictness: 'loose',
    timeStrictness: 'moderate',
    defaultSchedulingMode: 'fixed',
    shortLabel: 'Workout',
  },
};

export const SPORT_TYPES = Object.values(SportType) as SportType[];

export const LAUNCH_SPORT_TYPES = SPORT_TYPES.filter(
  (s) => SPORT_METADATA[s].launchEnabled
);

/** Play tab filter order — LA beta sports first, then broader launch set. */
export const PLAY_TAB_SPORT_ORDER: SportType[] = [
  SportType.PICKLEBALL,
  SportType.BASKETBALL,
  SportType.BADMINTON,
  SportType.TENNIS,
  SportType.VOLLEYBALL,
  SportType.SOCCER,
  SportType.SQUASH,
  SportType.RACQUETBALL,
  SportType.TABLE_TENNIS,
  SportType.ULTIMATE,
  SportType.RUNNING,
  SportType.HIKING,
  SportType.WORKOUT,
];

/** Stable Play tab order — selection does not move chips (ring + label show active sport). */
export function sortSportsForPlayTab<T extends { name: string }>(sports: T[]): T[] {
  const orderIndex = new Map(PLAY_TAB_SPORT_ORDER.map((sport, index) => [sport, index]));

  return [...sports].sort((a, b) => {
    const ai = orderIndex.get(a.name as SportType) ?? 999;
    const bi = orderIndex.get(b.name as SportType) ?? 999;
    return ai - bi;
  });
}

export function getSportMetadata(sportName: string): SportMetadata | undefined {
  const match = SPORT_TYPES.find((s) => s === sportName);
  return match ? SPORT_METADATA[match] : undefined;
}

/** Doubles round-robin mini tournaments (badminton, pickleball, tennis, etc.). */
export function sportSupportsMiniTournament(sportName: string): boolean {
  const meta = getSportMetadata(sportName);
  return meta?.miniTournamentEnabled !== false;
}

/** Doubles-style court rotation (badminton, pickleball, tennis, etc.). */
export function sportSupportsRotation(sportName: string): boolean {
  return sportSupportsMiniTournament(sportName);
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

/** Niche launch sports — fewer seeded courts; search wider on Create Game. */
export function usesWideCourtSearch(sportName: string): boolean {
  const meta = getSportMetadata(sportName);
  if (!meta?.launchEnabled) {
    return false;
  }
  return Boolean(
    meta.partnerDependent ||
      meta.name === SportType.VOLLEYBALL ||
      meta.name === SportType.SQUASH ||
      meta.name === SportType.RACQUETBALL ||
      meta.name === SportType.TABLE_TENNIS ||
      meta.name === SportType.ULTIMATE
  );
}

/** Radii to try when loading courts for Create Game (meters): nearby first, then wide fallback. */
export function getCourtSearchRadiiForSport(_sportName: string): number[] {
  return [CONFIG.COURT_SEARCH_NEARBY_RADIUS_M, CONFIG.COURT_SEARCH_WIDE_RADIUS_M];
}

/** Meetup sports (running, workout) publish with a ballpark area — not a court row. */
export function usesMeetupLocationPath(sportName: string): boolean {
  return getSportMetadata(sportName)?.locationStrictness === 'loose';
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

/** Suggested listing titles on Create game — synced with sport_templates where present. */
export const DEFAULT_LISTING_TITLES: Partial<Record<SportType, string>> = {
  [SportType.PICKLEBALL]: 'Open play · bring paddle',
  [SportType.BADMINTON]: 'Doubles · split court fee',
  [SportType.BASKETBALL]: 'Pickup run · full court',
  [SportType.TENNIS]: 'Casual hit · open court',
  [SportType.VOLLEYBALL]: 'Open gym · all levels welcome',
  [SportType.SOCCER]: 'Pickup match · need players',
  [SportType.SQUASH]: 'Looking for a hitting partner',
  [SportType.RACQUETBALL]: 'Open court · all levels',
  [SportType.TABLE_TENNIS]: 'Casual games · bring paddle',
  [SportType.ULTIMATE]: 'Pickup scrimmage · all welcome',
  [SportType.RUNNING]: 'Group run · easy pace',
  [SportType.HIKING]: 'Trail meetup · all paces',
  [SportType.WORKOUT]: 'Outdoor HIIT · all levels',
};

export function getDefaultListingTitle(sportName: string, templateHint?: string | null): string {
  const hint = templateHint?.trim();
  if (hint) {
    return hint;
  }
  const meta = getSportMetadata(sportName);
  if (meta && DEFAULT_LISTING_TITLES[meta.name]) {
    return DEFAULT_LISTING_TITLES[meta.name] as string;
  }
  return `${sportName} open game`;
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

export const ACTIVITY_DURATIONS = [30, 60, 90, 120] as const;
export type ActivityDuration = (typeof ACTIVITY_DURATIONS)[number];

export type SportRosterDefaults = {
  defaultMin: number;
  defaultMax: number;
  floorMin: number;
  ceilingMax: number;
};

const SPORT_ROSTER_DEFAULTS: Partial<Record<SportType, SportRosterDefaults>> = {
  [SportType.BADMINTON]: {
    defaultMin: 4,
    defaultMax: 6,
    floorMin: 2,
    ceilingMax: 12,
  },
  [SportType.PICKLEBALL]: {
    defaultMin: 4,
    defaultMax: 8,
    floorMin: 2,
    ceilingMax: 16,
  },
};

export function getSportRosterDefaults(sportName: string): SportRosterDefaults {
  const meta = getSportMetadata(sportName);
  const custom = meta ? SPORT_ROSTER_DEFAULTS[meta.name] : undefined;
  if (custom) {
    return custom;
  }
  const defaultMax = meta?.defaultTotalPlayers ?? 4;
  return {
    defaultMin: Math.max(2, defaultMax - 1),
    defaultMax,
    floorMin: 2,
    ceilingMax: 32,
  };
}

export function clampRosterMin(sportName: string, min: number, max: number): number {
  const { floorMin } = getSportRosterDefaults(sportName);
  return Math.min(max, Math.max(floorMin, min));
}

export function clampRosterMax(sportName: string, max: number, min: number): number {
  const { ceilingMax } = getSportRosterDefaults(sportName);
  return Math.max(min, Math.min(ceilingMax, max));
}

export function formatRosterRange(min: number, max: number): string {
  if (min >= max) {
    return `${max} player${max === 1 ? '' : 's'}`;
  }
  return `${min}–${max} players`;
}

export function formatRosterExpectation(min: number, max: number): string {
  if (min >= max) {
    return formatRosterRange(min, max);
  }
  return `${formatRosterRange(min, max)} · lock at ${min}`;
}

export function formatActivityDurationLabel(minutes: ActivityDuration): string {
  return minutes >= 120 ? '120m+' : `${minutes}m`;
}

export const ACTIVITY_VISIBILITY = ['friends', 'nearby', 'invite_only'] as const;
export type ActivityVisibility = (typeof ACTIVITY_VISIBILITY)[number];

export const CREATE_ACTIVITY_VISIBILITY = ['friends', 'nearby'] as const;
