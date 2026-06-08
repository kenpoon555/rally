import { sportSupportsMiniTournament } from './sports';
import { SportTemplate } from '../types/sportTemplate';

export type GameModeKind = 'activity' | 'tournament';

export type GameModeDefinition = {
  id: string;
  label: string;
  shortLabel: string;
  kind: GameModeKind;
  description: string;
};

export const PICKUP_GAME_MODE: GameModeDefinition = {
  id: 'pickup',
  label: 'Pickup session',
  shortLabel: 'Pickup',
  kind: 'activity',
  description: 'Set a time and roster — your Rally taps I\'m in on Play.',
};

export const MINI_TOURNAMENT_MODE: GameModeDefinition = {
  id: 'mini_doubles_round_robin',
  label: 'Mini tournament',
  shortLabel: 'Tournament',
  kind: 'tournament',
  description: 'Doubles round-robin bracket — join and play when you have 4+ players.',
};

const GAME_MODE_BY_TEMPLATE_KEY: Record<string, GameModeDefinition> = {
  mini_doubles_round_robin: MINI_TOURNAMENT_MODE,
};

/** Fresh default: next Saturday 10:00 local (not copied from last game). */
export function defaultRallyGameStartTime(now = new Date()): Date {
  const next = new Date(now);
  const day = next.getDay();
  const daysUntilSaturday = day === 6 ? 7 : (6 - day + 7) % 7;
  next.setDate(next.getDate() + daysUntilSaturday);
  next.setHours(10, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

export function resolveGameModesForSport(
  sport: string,
  template: SportTemplate | null
): GameModeDefinition[] {
  const modes: GameModeDefinition[] = [PICKUP_GAME_MODE];
  const seen = new Set<string>(['pickup']);

  const formatKeys = template?.tourney_formats ?? [];
  for (const key of formatKeys) {
    const mode = GAME_MODE_BY_TEMPLATE_KEY[key];
    if (mode && !seen.has(mode.id)) {
      modes.push(mode);
      seen.add(mode.id);
    }
  }

  if (
    formatKeys.length === 0 &&
    sportSupportsMiniTournament(sport) &&
    !seen.has(MINI_TOURNAMENT_MODE.id)
  ) {
    modes.push(MINI_TOURNAMENT_MODE);
  }

  return modes;
}

export function getGameModeById(id: string): GameModeDefinition | undefined {
  if (id === PICKUP_GAME_MODE.id) {
    return PICKUP_GAME_MODE;
  }
  return GAME_MODE_BY_TEMPLATE_KEY[id];
}
