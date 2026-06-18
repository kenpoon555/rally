# Flow — Mini tournament (inside Rally)

**Contract id:** `flow-mini-tournament`  
**Status:** Draft — partial ship; device QA pending  
**Phase:** 1.4  
**Screens:** `MiniTournamentScreen`, Rally hub tournament list, activity detail tournament section  
**Related code:** `src/pages/Tournament/MiniTournamentScreen.tsx`, `src/services/miniTournamentService.ts`, `RegularsCrewScreen` / `ActivityDetailScreen` entry points

## Purpose

Private round-robin / bracket night inside a Regulars Rally — not public leagues.

North-star: **Host starts mini tournament → members join → host starts → scores recorded → standings visible.**

## Demo setup

1. Host on Monrovia basketball Rally (or racket sport if UI enabled for sport).
2. Create tournament from Rally hub or activity detail.
3. Second account joins as member.

## Required states

| State | Role | Must show |
|-------|------|-----------|
| **Open** | Host | Start tournament when enough members |
| **Open** | Member | Join action |
| **In progress** | Both | Match list, score entry (host or designated) |
| **Completed** | Both | Final standings / winner |

## Pass/fail checklist

- [ ] Create tournament from Rally context succeeds
- [ ] Member can join open tournament
- [ ] Host can start; non-host cannot start
- [ ] Record match score updates standings
- [ ] Navigate back to Rally hub without crash
- [ ] Basketball/soccer sports respect hide rules if product disables tourney for sport
- [ ] No duplicate tournament rows on refresh

## Screenshots required

`docs/contracts/screenshots/flow-mini-tournament/` — open, joined, in-progress match list, completed.

## Out of scope

- Public ranked leagues (Stage 6+)
- Paid entry fees

## Related

- [module-rally-leaderboard.md](./module-rally-leaderboard.md)
- [flow-rally-session.md](./flow-rally-session.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated on device | — |
