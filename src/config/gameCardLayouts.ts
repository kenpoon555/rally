import { Activity } from '../types/activity';
import type { SportIconPreset, SportIconSurface } from './sportIconPresets';
import { resolveSportIconPreset } from './sportIconPresets';

export type GameListCardVariant = 'open' | 'locked_welcoming' | 'my_game';

/** Visual shell — one component family, multiple layouts. */
export type GameCardLayout =
  | 'listRow'
  | 'sessionInline'
  | 'homeNextUp'
  | 'detailHero'
  | 'mapTeaser';

export type GameKind = 'pickup' | 'rally';

/** How a viewer joins from this surface. */
export type JoinMode = 'request' | 'instant' | 'none';

/** Which invite link flavor share actions use. */
export type ShareMode = 'host' | 'public' | 'none';

export type GameCardPreset = {
  layout: GameCardLayout;
  gameKind: GameKind;
  joinMode: JoinMode;
  shareMode: ShareMode;
  showHostTools: boolean;
  showWhoGoing: boolean;
  showStatusSignal: boolean;
  showInlineActions: boolean;
  sessionVariant?: 'default' | 'rally';
  /** Leading icon column — see module-sport-icon contract. */
  sportIconSurface?: SportIconSurface;
};

/**
 * Canonical presets — add surfaces here instead of forking card components.
 * Agents: do not invent new layout flags on screens; extend this map.
 */
export const GAME_CARD_PRESETS = {
  discoverOpen: {
    layout: 'listRow',
    gameKind: 'pickup',
    joinMode: 'none',
    shareMode: 'none',
    showHostTools: false,
    showWhoGoing: false,
    showStatusSignal: true,
    showInlineActions: false,
    sportIconSurface: 'statusSignal',
  },
  discoverLockedWelcoming: {
    layout: 'listRow',
    gameKind: 'pickup',
    joinMode: 'none',
    shareMode: 'none',
    showHostTools: false,
    showWhoGoing: false,
    showStatusSignal: true,
    showInlineActions: false,
    sportIconSurface: 'statusSignal',
  },
  myGamesRow: {
    layout: 'listRow',
    gameKind: 'pickup',
    joinMode: 'none',
    shareMode: 'none',
    showHostTools: false,
    showWhoGoing: true,
    showStatusSignal: false,
    showInlineActions: false,
    sportIconSurface: 'todayGameList',
  },
  homeNextUp: {
    layout: 'homeNextUp',
    gameKind: 'pickup',
    joinMode: 'none',
    shareMode: 'none',
    showHostTools: false,
    showWhoGoing: false,
    showStatusSignal: false,
    showInlineActions: false,
    sportIconSurface: 'todayGameList',
  },
  rallySession: {
    layout: 'sessionInline',
    gameKind: 'rally',
    joinMode: 'instant',
    shareMode: 'host',
    showHostTools: false,
    showWhoGoing: true,
    showStatusSignal: false,
    showInlineActions: true,
    sessionVariant: 'rally',
    sportIconSurface: 'rallySessionCard',
  },
  detailPickup: {
    layout: 'detailHero',
    gameKind: 'pickup',
    joinMode: 'request',
    shareMode: 'host',
    showHostTools: true,
    showWhoGoing: true,
    showStatusSignal: false,
    showInlineActions: false,
    sportIconSurface: 'detailHero',
  },
  detailRally: {
    layout: 'detailHero',
    gameKind: 'rally',
    joinMode: 'instant',
    shareMode: 'host',
    showHostTools: true,
    showWhoGoing: true,
    showStatusSignal: false,
    showInlineActions: false,
    sportIconSurface: 'detailHero',
  },
  mapTeaser: {
    layout: 'mapTeaser',
    gameKind: 'pickup',
    joinMode: 'none',
    shareMode: 'none',
    showHostTools: false,
    showWhoGoing: true,
    showStatusSignal: false,
    showInlineActions: false,
    sportIconSurface: 'todayGameList',
  },
} as const satisfies Record<string, GameCardPreset>;

export type GameCardPresetKey = keyof typeof GAME_CARD_PRESETS;

export function getGameCardPreset(key: GameCardPresetKey): GameCardPreset {
  return GAME_CARD_PRESETS[key];
}

export function gameKindFromActivity(activity: Pick<Activity, 'regular_group_id'>): GameKind {
  return activity.regular_group_id ? 'rally' : 'pickup';
}

export function detailPresetForActivity(activity: Pick<Activity, 'regular_group_id'>): GameCardPreset {
  return gameKindFromActivity(activity) === 'rally'
    ? GAME_CARD_PRESETS.detailRally
    : GAME_CARD_PRESETS.detailPickup;
}

/** Host shares auto-join link; roster members share public request link. */
export function shareModeForViewer(
  preset: GameCardPreset,
  options: { isHost: boolean }
): ShareMode {
  if (preset.shareMode === 'none') {
    return 'none';
  }
  return options.isHost ? 'host' : 'public';
}

export function discoverPresetKey(sectionKey: 'open' | 'locked'): GameCardPresetKey {
  return sectionKey === 'locked' ? 'discoverLockedWelcoming' : 'discoverOpen';
}

/** Derive list-row visual variant from preset + activity state. */
export function gameListVariantFromPreset(
  presetKey: GameCardPresetKey,
  activity: Activity
): GameListCardVariant {
  if (presetKey === 'discoverOpen') {
    return 'open';
  }
  if (presetKey === 'discoverLockedWelcoming') {
    return 'locked_welcoming';
  }
  return gameListCardVariantForActivity(activity);
}

/** @deprecated Use gameListVariantFromPreset — kept for gradual migration. */
export function gameListCardVariantForActivity(activity: Activity): GameListCardVariant {
  const missing = activity.missing_players ?? 0;
  if (activity.match_status === 'finalized' && missing > 0) {
    return 'locked_welcoming';
  }
  return 'my_game';
}

export function listRowFlagsFromPreset(preset: GameCardPreset): {
  showWhoGoing: boolean;
  showStatusSignal: boolean;
} {
  return {
    showWhoGoing: preset.showWhoGoing,
    showStatusSignal: preset.showStatusSignal,
  };
}

export function sportIconPresetForGameCardList(
  presetKey: GameCardPresetKey
): SportIconPreset | null {
  return resolveSportIconPreset(getGameCardPreset(presetKey).sportIconSurface);
}
