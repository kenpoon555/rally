# Builder backlog — taste-tier6 · 2026-06-26

**Source:** [2026-06-26-taste-tier6-synthesis.md](./2026-06-26-taste-tier6-synthesis.md)
**Branch:** `fix/taste-tier6-builder`
**Bar:** Authoring changes — not tier-5 polish bugs

## P0 — Join Loop authoring (ship first)

| ID | Item | Contract | Likely files | Notes |
|----|------|----------|--------------|-------|
| J1 | Post-join **status banner** on `ActivityDetailScreen` (Confirm / Can't make it) | `flow-rally-session` | `ActivityDetailScreen.tsx`, `PRODUCT_COPY` | Port coaching labels; wire `setGameReady` / leave as Can't make |
| J2 | **Grouped roster** on detail + game room (Confirmed / Not responded / Can't make + counts) | `flow-rally-session` | `GameCardDetailHero`, `GameRoomActionBar` | Reuse `ClassDetailScreen` `groupedRoster` pattern |
| J3 | **Decide screen demotion** — hide reviews, tournaments, regulars below fold until joined | `flow-rally-session` | `ActivityDetailScreen.tsx` | `showHostToolsPanel` gating already partial — extend for non-host pre-join |
| J4 | Discover row **personal state chip** ("You're in", "Hosted by you") | `flow-play-screen` | `GameListCard.tsx`, `gameCardLayouts.ts` | Viewer enrollment from activity participants |

## P1 — Player path + momentum

| ID | Item | Contract | Likely files | Notes |
|----|------|----------|--------------|-------|
| J5 | **Player game room card** — roster groups + sticky Message (no lock/nudge) | `flow-game-room` | `GameRoomActionBar.tsx` | Split `isHost` render trees |
| J6 | **Post-game player exit** — next game card → Play deep link | `flow-post-game-attendance` | `PostGameAttendanceScreen.tsx`, navigation | Host keeps attendance form |
| J7 | Discover **urgency hook** line on card ("4 spots · starts in 3h") | `flow-play-screen` | `GameListCard.tsx` | Uses existing activity fields |

## P2 — Delight (optional v1)

| ID | Item | Contract | Likely files | Notes |
|----|------|----------|--------------|-------|
| J8 | Join CTA checkmark morph (or static success state) | `flow-rally-session` | `JoinRequestButton` / detail CTA | Static OK for v1 |
| J9 | Status banner slide-in animation | `module-visual-design-system` | shared banner component | Defer motion if tight |

## Explicitly NOT in this backlog

- Parked steal list S1–S9 from redesign spec
- Theme palette swap (`theme-explore-round1`)
- Class Can't make it / Message coach (`flow-class-session-response`)

## Builder done

```bash
./.cursor/hooks/product-review-loop-builder-done.sh
# → validation-loop-start.sh --queue taste-tier6 --builder
```
