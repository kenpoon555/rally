# Flow — Post-game recap

**Contract id:** `flow-post-game-recap`  
**Status:** Draft — partial ship  
**Phase:** 2.1  
**Screens:** `GameRecapCard` on activity detail, system share sheet  
**Related code:** `src/services/gameRecapService.ts`, `src/components/GameRecapCard.tsx`, `game_recaps` table

## Purpose

Shareable proof after a session — habit loop and off-app growth without building a social feed.

North-star: **After attendance submitted → recap card appears → host/member can share text recap.**

## Demo setup

1. Complete [flow-post-game-attendance.md](./flow-post-game-attendance.md) on demo session.
2. Recap id should exist on activity detail hero.

## Required states

| State | Must show |
|-------|-----------|
| **No recap** | Host prompt to record attendance first (if policy) |
| **Recap ready** | `GameRecapCard` with sport, time, court, attendees |
| **Share** | Native share sheet with formatted text |
| **Shared** | `recap_shared` event logged |

## Pass/fail checklist

- [ ] Recap loads via `get_game_recap` / `getGameRecapIdForActivity`
- [ ] Share text includes sport, time, court, attendees (no private data)
- [ ] `recap_shared` analytics event fires once per share action
- [ ] Recap visible on activity detail only (not duplicated on unrelated screens)
- [ ] Missing recap — graceful empty, no redbox

## Screenshots required

`docs/contracts/screenshots/flow-post-game-recap/` — card, share sheet (sim crop ok).

## Out of scope

- Image/graphic recap export (future)
- Auto-post to Instagram

## Depends on

- [flow-post-game-attendance.md](./flow-post-game-attendance.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
