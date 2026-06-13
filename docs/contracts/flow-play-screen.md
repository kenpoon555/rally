# Flow — Play / Discover screen

**Contract id:** `flow-play-screen`  
**Status:** Draft — sprint prep  
**Screens:** `HomeScreen` (Discover), `DynamicHomeScreen` (Today), map teaser cards  
**Related code:** `src/pages/Home/HomeScreen.tsx`, `src/components/game/GameCardShell.tsx`, `src/config/gameCardLayouts.ts`

## Purpose

Players browse open games on Discover and Today with consistent game cards, correct status signals, and navigation to detail.

North-star: **Open Discover → see open games with preset-driven cards → tap → Activity detail.**

## Demo setup

1. Seeds with active activities (`missing_players > 0`).
2. Tester location enabled for distance sort (optional).
3. Accounts: host + non-member tester.

## Required states

| State | Surface | Must show |
|-------|---------|-----------|
| **Discover open** | Home Discover tab | `discoverOpen` preset — status signal on |
| **Discover locked welcoming** | Finalized + spots | `discoverLockedWelcoming` variant |
| **Today Next Up** | DynamicHome | `homeNextUp` — plain sport icon via `todayGameList`, no status dot |
| **Empty Discover** | No listings | Empty state — no crash |
| **Sport filter** | Deep link or param | Filtered list updates |

## Pass/fail checklist

- [ ] All list rows use `GameCardShell` + preset (no ad-hoc layout flags)
- [ ] Open vs locked_welcoming variants match activity state
- [ ] Tap navigates to `ActivityDetail` with correct id
- [ ] Pull-to-refresh reloads without duplicate rows
- [ ] Map teaser (if enabled) uses `mapTeaser` preset

## Screenshots required

`docs/contracts/screenshots/flow-play-screen/` — discover open, locked welcoming, today next up, empty.

## Out of scope

- Host create flow (`flow-create-game`)
- Need-players posts

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
