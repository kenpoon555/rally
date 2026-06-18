# Flow — Post-game recap

**Contract id:** `flow-post-game-recap`  
**Status:** Shipped — **GTM 1 P0** (card load) + **P1** (share/analytics)  
**Phase:** 2.1  
**Screens:** `GameRecapCard` on activity detail, system share sheet  
**Related code:** `src/services/gameRecapService.ts`, `src/components/GameRecapCard.tsx`, `game_recaps` table

## Purpose

Shareable proof after a session — habit loop and off-app growth without building a social feed.

North-star: **After attendance submitted → recap card appears → host/member can share text recap.**

## Launch gate tiers

| Tier | When | Required for GTM 1 / `gtm1-launch-gate` |
|------|------|----------------------------------------|
| **P0 — minimum** | Attendance submitted | Recap card loads on activity detail — no redbox; graceful empty if missing |
| **P1 — full** | Post-beta polish | Share sheet, formatted text, `recap_shared` event |

**GTM 1 passes on P0 only.** P1 rows are recommended before scaling invites, not store-review blockers.

## Demo setup

1. Complete [flow-post-game-attendance.md](./flow-post-game-attendance.md) on demo session.
2. Recap id should exist on activity detail hero.

## Required states

| State | Must show | Tier |
|-------|-----------|------|
| **No recap** | Host prompt to record attendance first (if policy) | P0 |
| **Recap ready** | `GameRecapCard` with sport, time, court, attendees | P0 |
| **Share** | Native share sheet with formatted text | P1 |
| **Shared** | `recap_shared` event logged | P1 |

## Pass/fail checklist

### P0 — GTM 1 launch gate (required)

- [ ] After attendance submitted, recap loads via `get_game_recap` / `getGameRecapIdForActivity`
- [ ] Recap visible on activity detail only (not duplicated on unrelated screens)
- [ ] Missing recap — graceful empty, no redbox
- [ ] Recap text excludes private data (no emails, no minor-identifying content per [module-student-visibility.md](./module-student-visibility.md))

### P1 — full recap (post-beta)

- [ ] Share text includes sport, time, court, attendees (no private data)
- [ ] `recap_shared` analytics event fires once per share action
- [ ] Share sheet opens without crash on iOS + Android

## Screenshots required

`docs/contracts/screenshots/flow-post-game-recap/`

| File | Tier |
|------|------|
| `01-recap-card.png` | P0 |
| `02-recap-empty-graceful.png` | P0 |
| `03-share-sheet.png` | P1 |

## Out of scope

- Image/graphic recap export (future)
- Auto-post to Instagram

## Depends on

- [flow-post-game-attendance.md](./flow-post-game-attendance.md)

## Related

- [module-analytics-events.md](./module-analytics-events.md) — `recap_viewed`, `recap_shared`
- [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) — launch gate table

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-16 | Split P0/P1 per advisory review — validate P0 on device for gtm1 | — |
