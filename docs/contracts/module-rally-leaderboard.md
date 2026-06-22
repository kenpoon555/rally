# Module contract — Rally leaderboard

**Contract id:** `module-rally-leaderboard`  
**Status:** Draft — UI shipped; validation pending  
**Phase:** 1.5  
**Scope:** `RallyLeaderboardPanel` on Members tab / crew panel  
**Related code:** `src/components/RallyLeaderboardPanel.tsx`, `src/services/rallyLeaderboardService.ts`, RPC `get_rally_leaderboard`

## Purpose

In-group standings (attendance, tourney W/L, streaks) so members reopen Rally for culture — not WhatsApp.

North-star: **Member opens Rally Members tab → leaderboard loads → window toggle works.**

## Windows (required)

| Window | RPC param | Must show |
|--------|-----------|-----------|
| **All time** | `all` | Ranked entries with usernames |
| **Last 90 days** | `90` | Subset / filtered ranks |

## Pass/fail checklist

- [ ] Leaderboard loads for Monrovia demo Rally
- [ ] Window toggle refreshes without redbox
- [ ] Viewer rank highlighted when present
- [ ] Empty leaderboard shows copy — no crash for new Rally
- [ ] Entries match attendance / tourney data after known session (manual spot-check)
- [ ] No PII beyond public username

## Screenshots required

`docs/contracts/screenshots/module-rally-leaderboard/` — all-time, 90-day, empty.

## Out of scope

- Global / city-wide rankings
- Paid badge cosmetics

## Related

- [flow-mini-tournament.md](./flow-mini-tournament.md)
- [flow-post-game-attendance.md](./flow-post-game-attendance.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |

## Validator report

> Run: 2026-06-22 · `get_rally_leaderboard` RPC

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Leaderboard loads | ✅ | 11 entries all-time |
| 2 | 90-day window | ✅ | 11 entries with `p_window_days: 90` |
| 3 | Viewer rank highlight | N/T | Members tab deep link needs Metro reload |
| 4 | Empty state | N/T | — |
| 5 | Data matches attendance | ✅ | `@marcus` rank 1, 4 sessions |

**Last validated:** 2026-06-22 — RPC green
