import { getSportMetadata, SportType } from '../constants/sports';

/** Sports with an active free-agent discover board (Profile posting allowed). */
export const FREE_AGENT_BOARD_SPORTS: SportType[] = ['Badminton', 'Pickleball'];

/** Sports with need-players discover posts (when surfaced on Play). */
export const NEED_PLAYERS_BOARD_SPORTS: SportType[] = ['Badminton', 'Pickleball'];

export function sportSupportsFreeAgentBoard(sport: string | null | undefined): boolean {
  if (!sport) return false;
  return FREE_AGENT_BOARD_SPORTS.includes(sport as SportType);
}

export function sportSupportsNeedPlayersBoard(sport: string | null | undefined): boolean {
  if (!sport) return false;
  return NEED_PLAYERS_BOARD_SPORTS.includes(sport as SportType);
}

/**
 * Play discover list RPCs must always scope to the sport strip selection.
 * Passing null returns all sports and leaks rows (e.g. Running filter → Badminton posts).
 */
export function playDiscoverSportFilter(selectedSport: string): string {
  return selectedSport;
}

export type PlayClassesSegmentContext = {
  classesDiscoverEnabled: boolean;
  hasClassContext: boolean;
  isCoach: boolean;
  userId?: string | null;
};

/** Classes segment: flag on + coach or parent/coach with class enrollments — not all flag-on users. */
export function shouldShowPlayClassesSegment(ctx: PlayClassesSegmentContext): boolean {
  if (!ctx.classesDiscoverEnabled || !ctx.userId) return false;
  if (ctx.isCoach) return true;
  if (ctx.hasClassContext) return true;
  return false;
}

/** Meetup-style discover sports — empty copy uses "meetups" not "games". */
export const MEETUP_DISCOVER_SPORTS: SportType[] = [
  SportType.RUNNING,
  SportType.WORKOUT,
  SportType.HIKING,
];

export function isMeetupDiscoverSport(sport: string): boolean {
  return MEETUP_DISCOVER_SPORTS.includes(sport as SportType);
}

export function discoverGamesEmptyTitle(sport: string): string {
  const label = getSportMetadata(sport)?.shortLabel ?? sport;
  if (isMeetupDiscoverSport(sport)) {
    return `No ${label} meetups nearby`;
  }
  return `No ${label} games nearby`;
}

export function discoverEmptyHostStepHint(sport: string): string {
  if (isMeetupDiscoverSport(sport)) {
    return 'Set a time and meet point — shows up here for nearby players.';
  }
  return 'List a time and court — shows up here for nearby players.';
}

export function freeAgentEmptyCopy(sport: string): { title: string; body: string } {
  if (sportSupportsFreeAgentBoard(sport)) {
    return {
      title: 'No players nearby yet',
      body: 'Post your availability from Profile, or check back later.',
    };
  }
  return {
    title: `No ${sport.toLowerCase()} players posting yet`,
    body: 'Try another sport in the strip, or host a game and invite friends.',
  };
}
