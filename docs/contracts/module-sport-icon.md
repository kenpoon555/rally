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
| `discoverEmptyState` | lg | Discover empty state |
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

## Pass/fail checklist

- [ ] Today, Inbox, Rally hub, and detail use plain glyphs (no yellow ring)
- [ ] Same sport shows same glyph style across Today and Inbox
- [ ] Discover open games use status signal OR plain preset — not ring
- [ ] No inline `SportIcon` with non-plain `variant=` outside `SportIcon.tsx`
- [ ] `__tests__/sportIconPresets.test.ts` passes

## Related

- [module-game-card.md](./module-game-card.md)
- [flow-play-screen.md](./flow-play-screen.md)
- [flow-rally-session.md](./flow-rally-session.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | `SportBadge` on non-rally crew cards — migrate to plain or remove | — |
| — | `InviteFriendsToGameSheet` still uses raw `MaterialCommunityIcons` | — |
