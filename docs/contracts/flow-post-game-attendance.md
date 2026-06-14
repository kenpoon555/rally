# Flow — Post-game attendance

**Contract id:** `flow-post-game-attendance`  
**Status:** Draft — shipped; extend validation  
**Phase:** 0 / reliability  
**Screens:** `PostGameAttendanceScreen`, `GameCardDetailHero` host CTA  
**Related code:** `src/pages/Activity/PostGameAttendanceScreen.tsx`, `submit_game_attendance` RPC, `GameCardDetailHero`

## Purpose

Host records who showed up after a locked session ends — feeds reliability stats and recap generation.

North-star: **Host opens past session → marks attendance → reliability updates for members.**

## Demo setup

1. Locked session with `start_time` in the past (seed or adjust demo activity).
2. Host: `marcus@rally-mvrhoops.demo`.

## Required states

| State | Must show |
|-------|-----------|
| **Eligible host** | "Record attendance" / post-game CTA on detail hero |
| **Attendance form** | Roster list with toggles per player |
| **Submitted** | Success confirmation; optional recap prompt |
| **Non-host** | Cannot submit attendance |

## Pass/fail checklist

- [ ] CTA only for host after game end + lock policy met
- [ ] Submit writes attendance via `submit_game_attendance`
- [ ] Re-submit blocked or idempotent per product rules
- [ ] Member reliability / profile stats update after submit (refresh profile)
- [ ] Non-host blocked with clear message

## Screenshots required

`docs/contracts/screenshots/flow-post-game-attendance/` — cta, form, success.

## Related

- [flow-rally-session.md](./flow-rally-session.md)
- [flow-post-game-recap.md](./flow-post-game-recap.md)
- [module-rally-leaderboard.md](./module-rally-leaderboard.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
