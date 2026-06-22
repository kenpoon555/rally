# Module contract — Sport icon

**Contract id:** `module-sport-icon`  
**Scope:** Sport glyph appearance across Today, Discover, Rally, Inbox, detail, game room  
**Config:** `src/config/sportIconPresets.ts`  
**Component:** `src/components/SportIcon.tsx` (primitives), `src/components/SportIconForSurface.tsx` (canonical entry)  
**Game card link:** `sportIconSurface` field on `GAME_CARD_PRESETS` in `gameCardLayouts.ts`

## Purpose

One sport icon family with **named surfaces** and a single visual treatment: **plain black glyph** (no yellow ring, no filled tile). Sizes differ per layout column only.

## Surface matrix (required)

All surfaces use `variant: 'plain'`. Size varies by column width.

| Surface key | Size | Used on |
|-------------|------|---------|
| `todayGameList` | md | Today Next Up, My Games, calendar rows |
| `rallySessionCard` | sm | Rally Play `CrewGameSessionCard` |
| `rallyHubHeader` | lg | Rally hub header |
| `detailHero` | md | Activity detail hero |
| `inboxGameRow` | sm | Inbox game thread |
| `inboxRallyRow` | sm | Inbox Rally row |
| `rallyCarousel` | md | Today Rallies carousel |
| `discoverSportFilter` | md | Play sport filter chips |
| `gameRoomCollapsed` | sm | Game room collapsed bar |
| `rallyInviteCard` | md | Today Rally invite / row cards |
| `shareSheet` | lg | Invite share sheets |
| `discoverEmptyState` | lg | Discover empty state hero — **plain glyph only** or **56px circle** matching `discoverSportFilter` footprint |
| `statusSignal` | — | Discover list — status dot, no sport icon |

## API (required entry points)

| Function / component | Use |
|---------------------|-----|
| `SportIconForSurface({ sport, surface })` | **Preferred** — any screen with a named surface |
| `SportIconFromPreset({ sport, preset })` | List cards receiving preset from `GameCardShell` |
| `getSportIconPreset(surface)` | Read variant + size |
| `resolveSportIconPreset(sportIconSurface)` | From game-card preset field |
| `sportIconPresetForGameCardList(presetKey)` | List shell leading column |
| `getSportIconName(sport)` | **Only** when MaterialCommunityIcons is required outside `SportIcon` (migrate away) |

## Rules for agents

1. **Never** pass raw `variant=` on screens — use `SportIconForSurface` or game-card preset.
2. **All surfaces are plain** — do not reintroduce `ring`, `ghost`, `tile`, or `filter` on product screens without updating this contract.
3. **New surface** → add to `SPORT_ICON_SURFACES` with `variant: 'plain'` + appropriate size.
4. **Game cards** → set `sportIconSurface` on `GAME_CARD_PRESETS`; list rows use `GameCardShell`.
5. **`discoverEmptyState`** — do not pass ad-hoc `backgroundColor` on `SportIconForSurface` that creates a square tile smaller/larger than the glyph column. Prefer no fill, or a **56×56** circle (`borderRadius: 28`) aligned to filter chips.

## Discover empty state (required)

| Rule | Pass | Fail |
|------|------|------|
| Variant | `plain` per `discoverEmptyState` preset | Yellow ring, filled square tile |
| Alignment | Icon visually centered above empty title | Glyph offset inside pale square block |
| Size harmony | `lg` glyph column (48px) or match filter ring (56px) | Mismatched box vs Play strip icons |
| Implementation | Style via preset / shared empty-state wrapper | Inline `backgroundColor` on `SportIconForSurface` in `DiscoverEmptyState.tsx` |

**Likely fix:** Remove `sportIcon.backgroundColor` or replace with circular container shared with filter geometry.

## Pass/fail checklist

- [ ] Today, Inbox, Rally hub, and detail use plain glyphs (no yellow ring)
- [ ] Same sport shows same glyph style across Today and Inbox
- [ ] Discover open games use status signal OR plain preset — not ring
- [ ] No inline `SportIcon` with non-plain `variant=` outside `SportIcon.tsx`
- [ ] `__tests__/sportIconPresets.test.ts` passes
- [ ] **Discover empty state:** hero icon centered — plain glyph or 56px circle; no misaligned square tile ([flow-play-screen.md](./flow-play-screen.md) screenshot `discover-empty-icon-aligned.png`)

## Related

- [module-game-card.md](./module-game-card.md)
- [flow-play-screen.md](./flow-play-screen.md)
- [flow-rally-session.md](./flow-rally-session.md)

## Validator report

> Run: 2026-06-22 ~14:00 PT · iOS Simulator · `dev` · Racquetball via More

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Discover empty hero aligned | ❌ Fail | Square `primaryLight` behind plain `lg` glyph — visual offset. |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | `DiscoverEmptyState` square background misaligns hero icon (B11) | Builder / Fixer |
| — | `SportBadge` on non-rally crew cards — migrate to plain or remove | — |
| — | `InviteFriendsToGameSheet` still uses raw `MaterialCommunityIcons` | — |
