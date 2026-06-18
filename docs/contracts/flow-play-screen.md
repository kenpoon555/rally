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
| **Discover open** | Play → Games | `discoverOpen` preset — status signal on |
| **Discover locked welcoming** | Play → Games | `discoverLockedWelcoming` variant |
| **Players nearby** | Play → Players | Free-agent rows + section header (see screenshot) |
| **Classes (v1.1+)** | Play → Classes | Adult coach-led listings — **same sport filter as Games** — [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) |
| **Today Next Up** | DynamicHome | `homeNextUp` — plain sport icon via `todayGameList`, no status dot |
| **Empty Discover** | Play → Games | Empty state — no crash |
| **Today empty (new host)** | User with zero Rallies / no Next Up | CTA: Create a Rally + Find a game — no dead screen |
| **Sport filter** | Deep link or param | Filtered list updates (Games; Classes when shipped) |

## Pass/fail checklist

- [ ] All list rows use `GameCardShell` + preset (no ad-hoc layout flags)
- [ ] Open vs locked_welcoming variants match activity state
- [ ] Tap navigates to `ActivityDetail` with correct id
- [ ] Pull-to-refresh reloads without duplicate rows
- [ ] Map teaser — **deferred** until `MapScreen` wires `mapTeaser` preset (see [module-game-card.md](./module-game-card.md))
- [ ] **Today empty:** new user / no Rallies sees Create Rally + Discover CTAs (no blank screen)
- [ ] Play → **Players** segment loads free-agent list (regression when Classes added)
- [ ] When Classes ships: selected sport filter applies to Classes same as Games (see navigation contract)

## Play → Classes (deferred — separate contract)

Third segment **Games | Players | Classes** is specified in [module-coach-parent-navigation.md](./module-coach-parent-navigation.md). Hidden behind feature flag until v1.1. **Not part of GTM 1 baseline validation.**

## Screenshots required

`docs/contracts/screenshots/flow-play-screen/` — discover open, locked welcoming, **players nearby**, today next up, today empty host, discover empty.

## Out of scope

- Host create flow (`flow-create-game`)
- Need-players posts
- Play → Classes segment (see `module-coach-parent-navigation`)
- Parent Family UI (see `module-student-profile`)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
