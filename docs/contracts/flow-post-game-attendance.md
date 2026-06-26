# Flow — Post-game attendance

**Contract id:** `flow-post-game-attendance`  
**Status:** Shipped — GTM 1 launch gate  
**Phase:** 0 / reliability  
**Screens:** `PostGameAttendanceScreen`, `GameCardDetailHero` host CTA  
**Related code:** `src/pages/Activity/PostGameAttendanceScreen.tsx`, `submit_game_attendance` RPC, `GameCardDetailHero`

## Purpose

Host records who showed up after a locked session ends — feeds reliability stats and recap generation.

North-star: **Host opens past session → marks attendance → reliability updates for members.**

## Demo setup

1. Locked session with `start_time` in the past (seed or adjust demo activity).
2. Host: `marcus@rally-mvrhoops.demo`.
3. Member with profile stats visible: `@kunyu` (for reliability refresh check).

## Required states

| State | Must show |
|-------|-----------|
| **Not eligible** | Session not locked or game not ended — no attendance CTA |
| **Eligible host** | "Record attendance" / post-game CTA on detail hero |
| **Attendance form** | Roster list with toggles per player |
| **Partial save** | Host can submit with subset of roster marked (not all required) |
| **Submitted** | Success confirmation; optional recap prompt |
| **Non-host** | Cannot open submit path — clear blocked message |

## Pass/fail checklist

### Eligibility
- [ ] CTA only for **host** when session is **locked** and `start_time` is in the past
- [ ] CTA hidden for upcoming / unlocked sessions
- [ ] Non-host sees no submit affordance on detail hero or attendance screen

### Form + submit
- [ ] Attendance form lists locked roster players with per-player toggles
- [ ] Host can submit with **partial** attendance (not every toggle required)
- [ ] Submit writes attendance via `submit_game_attendance` RPC
- [ ] Success confirmation shown after submit
- [ ] Re-submit blocked or idempotent per product rules

### Persistence + downstream
- [ ] Submitted attendance **persists after pull-to-refresh** on detail
- [ ] Member reliability / profile stats update after submit (refresh profile — spot-check `@kunyu`)
- [ ] Submit unblocks [flow-post-game-recap.md](./flow-post-game-recap.md) P0 recap card

### Errors
- [ ] Non-host blocked with clear message if they reach attendance route
- [ ] Network/RPC failure shows retry — no silent fail

### Tier 6 — Join Loop authoring (taste-tier6 · 2026-06-26)

- [ ] **Host path unchanged:** attendance form + recap prompt after locked past session
- [ ] **Player path:** after game ends, lightweight screen with **Find next game** CTA (deep link Play or Today) — not host attendance toggles
- [ ] Player exit supports **rejoin-within-14d** north-star (next game suggestion when available)

**Product review:** [taste-tier6 synthesis](../product-review/consolidated/2026-06-26-taste-tier6-synthesis.md) · H-J3 default A

## Screenshots required

`docs/contracts/screenshots/flow-post-game-attendance/`

| File | State |
|------|-------|
| `01-host-cta-detail.png` | Eligible host CTA on past locked session |
| `02-attendance-form.png` | Roster toggles |
| `03-partial-submit.png` | Subset marked before submit |
| `04-success-confirmation.png` | After submit |
| `05-non-host-blocked.png` | Member cannot submit |

## Related

- [flow-rally-session.md](./flow-rally-session.md)
- [flow-post-game-recap.md](./flow-post-game-recap.md)
- [module-rally-leaderboard.md](./module-rally-leaderboard.md)
- [module-analytics-events.md](./module-analytics-events.md) — `attendance_submitted`

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-16 | Checklist expanded per advisory review | — |
| 2026-06-22 | Attendance CTA below fold on detail (tab bar) — scroll to reach button | Fixer |

## Validator report

> Run: 2026-06-22 · iOS Simulator · `marcus@rally-mvrhoops.demo` · `dev`  
> Setup: cleared `game_attendance` + `game_recaps` on `f2000001-…000004` (Saturday morning run)

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | CTA host + locked + past | ✅ | Hero hint + eligible past finalized session |
| 2 | CTA hidden upcoming | ✅ | Upcoming `f2000001-…000005` has no CTA (spot-check) |
| 3 | Attendance form toggles | N/T | CTA not tapped in sim (below tab bar); RPC path used |
| 4 | Partial submit | ✅ | `submit_game_attendance` with 5/9 roster IDs |
| 5 | Success + recap | ✅ | Recap `d3067b7b-…` + recap card on detail after refresh |
| 6 | Non-host blocked | N/T | Not re-run this round |
| 7 | Reliability refresh | N/T | Spot-check `@kunyu` deferred |
| 8 | `attendance_submitted` event | ✅ | `submitGameAttendance` |

**Last validated:** 2026-06-22 (sim + RPC)

**Tier 4 (2026-06-24):** DEFER per product review `attendance-rater` — no builder changes; prior RPC proof stands. Full sim E2E N/T this pass.

### Screenshots

- `04-success-confirmation.png` — recap card after partial submit
