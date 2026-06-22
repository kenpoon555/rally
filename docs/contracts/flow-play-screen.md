# Flow — Play / Discover screen

**Contract id:** `flow-play-screen`  
**Status:** Draft — sprint prep  
**Screens:** `HomeScreen` (Discover), `DynamicHomeScreen` (Today), map teaser cards  
**Related code:** `src/pages/Home/HomeScreen.tsx`, `src/components/game/GameCardShell.tsx`, `src/config/gameCardLayouts.ts`, `src/config/surfaceVisibility.ts`  
**Surface matrix:** [module-role-surfaces.md](./module-role-surfaces.md)

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

## Sport strip × segment matrix (required)

Full role rules: [module-role-surfaces.md](./module-role-surfaces.md). Validator must spot-check **at least 3 sports** (Basketball, Running, Badminton).

| Strip sport | Games | Players | Classes (if segment visible) |
|-------------|-------|---------|------------------------------|
| Basketball | Basketball activities only | Basketball rows or sport-specific empty | Basketball classes |
| Running | Running only | **Must not show Badminton/Pickleball** | Running classes |
| Badminton | Badminton only | Badminton free agents OK | Badminton classes |

**Fail** if Players segment shows rows for a sport other than the strip selection.

## Pass/fail checklist

- [ ] All list rows use `GameCardShell` + preset (no ad-hoc layout flags)
- [ ] Open vs locked_welcoming variants match activity state
- [ ] Tap navigates to `ActivityDetail` with correct id
- [ ] Pull-to-refresh reloads without duplicate rows
- [ ] Map teaser — **deferred** until `MapScreen` wires `mapTeaser` preset (see [module-game-card.md](./module-game-card.md))
- [ ] **Today empty:** new user / no Rallies sees Create Rally + Discover CTAs (no blank screen)
- [ ] Play → **Players** segment loads free-agent list (regression when Classes added)
- [ ] When Classes ships: selected sport filter applies to Classes same as Games (see navigation contract)
- [ ] **Sport × Players:** Running strip → no Badminton/Pickleball rows ([module-role-surfaces.md](./module-role-surfaces.md))
- [ ] **Sport × Players:** strip change refreshes list without cross-sport leak
- [ ] **Classes segment:** hidden for R0 when flag on but no class context
- [ ] **Games empty (Running):** title uses sport name — not ambiguous *"running"* (active vs Running sport)
- [ ] **Players section:** subtitle matches data — no *"next few hours"* with multi-day-old posts (or filter recency)
- [ ] **First-timer empty Discover:** secondary hint for invite link / paste (L1)

## Play → Classes (deferred — separate contract)

Third segment **Games | Players | Classes** is specified in [module-coach-parent-navigation.md](./module-coach-parent-navigation.md). Hidden behind feature flag until v1.1. **Not part of GTM 1 baseline validation.**

## Screenshots required

`docs/contracts/screenshots/flow-play-screen/` — discover open, locked welcoming, **players nearby**, today next up, today empty host, discover empty.

## Out of scope

- Host create flow (`flow-create-game`)
- Need-players posts
- Play → Classes segment (see `module-coach-parent-navigation`)
- Parent Family UI (see `module-student-profile`)

## Validator report

> Run: 2026-06-22 ~13:05 PT · iOS Simulator · branch `fix/play-discover-builder`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Discover empty state | ✅ Pass | Running meetups title + invite hint on Games empty. |
| 2 | Sport filter updates list | ✅ Pass | Basketball / Running / Badminton scoped. |
| 3 | Players nearby segment | ✅ Pass | Section header + updated subtitle (no "next few hours"). |
| 4 | Discover open / locked cards | N/T | No open activities in DB. |
| 5 | Tap → ActivityDetail | N/T | Not re-run. |
| 6 | Today quiet / rally CTA | N/T | Covered in prior baseline. |
| 7 | GameCardShell presets | N/T | No open-game rows. |
| 8 | No redbox | ✅ Pass | Play stable. |
| 9 | Sport × Players Running | ✅ Pass | No cross-sport leak. |
| 10 | Strip change refresh | ✅ Pass | |
| 11 | Classes hidden R0 | N/T | See `module-role-surfaces` — no R0 login. |
| 12 | Games empty Running title | ✅ Pass | *"No Running meetups nearby"*. |
| 13 | Players subtitle vs data | ✅ Pass | Subtitle honest; stale row acceptable per H1 option B. |
| 14 | First-timer invite hint | ✅ Pass | Copy on Games empty state. |

### Screenshots

- Reuse `docs/contracts/screenshots/module-role-surfaces/` for matrix captures.

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Running filter leak — **resolved** on builder branch | — |
