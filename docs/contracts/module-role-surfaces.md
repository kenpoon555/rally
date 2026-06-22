# Module contract — Role × surface visibility

**Contract id:** `module-role-surfaces`  
**Status:** Draft — Jun 2026 (Play filter leak fix)  
**Source of truth (code):** `src/config/surfaceVisibility.ts`  
**Related code:** `HomeScreen.tsx`, `ProfileScreen.tsx`, `DynamicHomeScreen.tsx`, `coachParentService.ts`  
**Parent contract:** [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)  
**Play UX:** [flow-play-screen.md](./flow-play-screen.md)

## Purpose

Single testable map of **who sees what** on each tab surface. Prevents:

- Wrong-sport rows when the sport strip changes (e.g. Running → Badminton free agents).
- Classes segment visible to R0 players when only the feature flag is on.
- Coach/parent tools leaking to teens or player-only accounts.

North-star: **Each role + sport selection shows only relevant surfaces and rows — never cross-sport or cross-role noise.**

## Demo setup

| Role | Account | Flags |
|------|---------|-------|
| R0 player | `@kunyu` or **fresh 18+ signup** (preferred when `@kunyu` password unavailable) | CPS flags **off** for baseline; repeat with flags **on** |
| R2 coach | `marcus@rally-mvrhoops.demo` | `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION=true` |
| R4 dual | `marcus@rally-mvrhoops.demo` | Coach + parent seed optional |
| R5 teen | Fresh signup age 13–17 | CPS flags on |

Restart Metro after flag changes. Re-seed: `./scripts/seed-monrovia-linked.sh`

## Play — sport strip × segment matrix

**Rule:** List RPCs always pass `playDiscoverSportFilter(selectedSport)` — never `null` when a sport is selected.

| Sport strip | Games segment | Players segment | Classes segment (if visible) |
|-------------|---------------|-----------------|------------------------------|
| **Basketball** | Only basketball activities (or empty) | Only basketball free-agent rows (or sport-specific empty) | Only basketball class listings |
| **Running** | Only running meetups (or empty) | **No Badminton/Pickleball rows** — empty with Running copy | Only running classes (if any) |
| **Badminton** | Filtered games | Badminton free agents (board sport) | Badminton classes |
| **Pickleball** | Filtered games | Pickleball free agents (board sport) | Pickleball classes |
| **Any other sport** | Filtered games | Empty — title mentions selected sport | Filtered classes |

### Players empty copy

| Board sport? | Empty title |
|--------------|-------------|
| Badminton / Pickleball | "No players nearby yet" + Profile post hint |
| All others | "No {sport} players posting yet" + try another sport / host game |

## Play — Classes segment visibility

| Condition | Classes pill |
|-----------|--------------|
| `COACH_CLASSES_DISCOVER` off | Hidden |
| Flag on + R0 player (no enrollments, not coach) | **Hidden** |
| Flag on + approved coach | Shown |
| Flag on + parent/coach with enrollments or coach classes | Shown |
| Not signed in | Hidden |

Implemented via `shouldShowPlayClassesSegment()` in `surfaceVisibility.ts`.

## Profile surfaces

| Surface | R0 player | Coach | Parent | Teen | Dual |
|---------|-----------|-------|--------|------|------|
| Family section | Hidden | Hidden* | Shown (flag on) | Hidden | Shown |
| Coach Tools | Hidden | Shown | Hidden | **Never** | Shown |
| Free agent post (Profile) | Badminton/Pickleball only | Same | Same | Per teen policy | Same |

\*Unless parent with children — see navigation contract.

## Today surfaces

| Card / block | R0 | Coach (no classes) | Parent (no children) | Parent + enrollments | Teen |
|--------------|----|--------------------|------------------------|----------------------|------|
| MY CLASSES | Hidden | Hidden | Hidden | Shown | Hidden |
| Coach today card | Hidden | Per coach contract | Hidden | N/A | Hidden |
| Rally / Next Up | Shown | Shown | Shown | Shown | Shown |

## Pass/fail checklist

- [ ] **Running → Players:** zero rows OR only Running rows — never other sports
- [ ] **Basketball → Players:** same rule
- [ ] **Badminton → Players:** may show seeded free agents; all rows Badminton
- [ ] Sport strip change updates Players list without stale cross-sport rows
- [ ] R0 + flags on: **no** Classes segment on Play
- [ ] Marcus (coach): Classes segment visible when flag on
- [ ] Parent with enrollment: Classes segment visible when flag on
- [ ] Teen Profile: no Coach Tools, no Family (CPS on)
- [ ] `player-no-coach-tools` on Profile: no Coach Tools / Family blocks
- [ ] Deep link `discoverMode=free_agents` + sport still respects sport filter

## Screenshots required

`docs/contracts/screenshots/module-role-surfaces/`

| File | Capture |
|------|---------|
| `01-running-players-empty.png` | Running strip → Players — no wrong-sport rows |
| `02-r0-no-classes-segment.png` | Fresh R0 signup — Games \| Players only (no Classes) |
| `03-coach-classes-segment.png` | Marcus — Games \| Players \| Classes |
| `04-badminton-players-rows.png` | Badminton strip → Players with rows |

## Validator report

> Pending — queue `role-surface-audit`

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Initial contract + code fix for Running filter leak | Builder |
