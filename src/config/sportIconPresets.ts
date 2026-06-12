/** Visual treatment for `SportIcon` — one map, many surfaces. */
export type SportIconVariant = 'tile' | 'plain' | 'ring' | 'filter' | 'ghost';
export type SportIconSize = 'sm' | 'md' | 'lg';

export type SportIconPreset = {
  variant: SportIconVariant;
  size: SportIconSize;
};

/**
 * Canonical sport icon surfaces — all use plain glyph (no yellow ring / tile / filter).
 * Sizes differ per layout column; variant is always plain unless statusSignal.
 */
export const SPORT_ICON_SURFACES = {
  /** Today / My Games list rows. */
  todayGameList: { variant: 'plain', size: 'md' },
  /** Rally Play session card. */
  rallySessionCard: { variant: 'plain', size: 'sm' },
  /** Rally hub header. */
  rallyHubHeader: { variant: 'plain', size: 'lg' },
  /** Activity detail hero. */
  detailHero: { variant: 'plain', size: 'md' },
  /** Inbox game thread row. */
  inboxGameRow: { variant: 'plain', size: 'sm' },
  /** Inbox Rally / group row. */
  inboxRallyRow: { variant: 'plain', size: 'sm' },
  /** Today Rallies carousel tile. */
  rallyCarousel: { variant: 'plain', size: 'md' },
  /** Play tab sport filter chips. */
  discoverSportFilter: { variant: 'plain', size: 'md' },
  /** Game room collapsed header strip. */
  gameRoomCollapsed: { variant: 'plain', size: 'sm' },
  /** Today Rally invite + row cards. */
  rallyInviteCard: { variant: 'plain', size: 'md' },
  /** Share sheets (game / Rally invite). */
  shareSheet: { variant: 'plain', size: 'lg' },
  /** Discover empty state hero. */
  discoverEmptyState: { variant: 'plain', size: 'lg' },
  /** Default list / legacy surfaces. */
  defaultTile: { variant: 'plain', size: 'md' },
} as const satisfies Record<string, SportIconPreset>;

export type SportIconSurfaceKey = keyof typeof SPORT_ICON_SURFACES;

/** Sentinel — leading column uses status dot/lock, not a sport glyph. */
export type SportIconSurface = SportIconSurfaceKey | 'statusSignal';

export function getSportIconPreset(surface: SportIconSurfaceKey): SportIconPreset {
  return SPORT_ICON_SURFACES[surface];
}

/** Resolve preset from a game-card `sportIconSurface` field; null when status signal column is used. */
export function resolveSportIconPreset(
  surface: SportIconSurface | undefined
): SportIconPreset | null {
  if (!surface || surface === 'statusSignal') {
    return null;
  }
  return getSportIconPreset(surface);
}

export function sportIconSurfaceKeyForDetail(
  surface: SportIconSurface | undefined
): SportIconSurfaceKey {
  if (!surface || surface === 'statusSignal') {
    return 'detailHero';
  }
  return surface;
}
