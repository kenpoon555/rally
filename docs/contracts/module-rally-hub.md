# Module contract — Rally hub (Regulars crew)

**Contract id:** `module-rally-hub`  
**Status:** Draft — validate before Rally hub refactors  
**Scope:** `RegularsCrewScreen` — Chat / Play / Members tabs and shared header  
**Related code:** `src/pages/Regulars/RegularsCrewScreen.tsx`, `src/components/rally/RallyPlayPanel.tsx`, `src/components/rally/RallyCrewPanel.tsx`, `src/components/rally/RallyChatPanel.tsx`

## Purpose

One Rally = one persistent hub with three tabs. Session cards, polls, tournaments, and leaderboard attach here — not new top-level silos.

North-star: **Member opens Rally → Play tab shows session state → Chat tab is crew thread → Members tab shows roster.**

## Tab rules (required)

| Tab | Must show | Must not |
|-----|-----------|----------|
| **Chat** | `crew_group` thread, session cards inline when posted | Duplicate game-room for same session without reason |
| **Play** | Upcoming session card(s), Create game CTA, empty state | Crash on zero upcoming games |
| **Members** | Member list, invite affordance for host | Expose private emails |

## Header (required)

- Rally name + sport visible on all tabs
- Back navigation returns to Inbox / previous stack without losing session state incorrectly
- Host-only actions scoped to host role

## Pass/fail checklist

- [ ] Chat / Play / Members switch without redbox
- [ ] Same upcoming session visible on Play tab and Today Next Up (when applicable)
- [ ] Keyboard-safe composer on Chat tab (Android + iOS)
- [ ] Deep link / Inbox row lands on correct Rally id
- [ ] Non-member cannot access hub (redirect or empty)

## Screenshots required

`docs/contracts/screenshots/module-rally-hub/` — chat tab, play tab host, play tab member, members tab, empty play.

## Related

- [flow-rally-session.md](./flow-rally-session.md)
- [flow-inbox.md](./flow-inbox.md)
- [module-game-card.md](./module-game-card.md)

## Out of scope

- Mini tournament scoring UI (see `flow-mini-tournament.md`)
- Availability poll creation UI (see `flow-availability-poll.md`)

## Validator report

> Run: 2026-06-22 ~01:04 PT · iOS Simulator · branch `fix/overnight-jun-2026-batch`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Tab switch | ✅ Pass | Chat / Play / Members — no redbox. |
| 2 | Header name + sport | ✅ Pass | Basketball · 10 members on all tabs. |
| 3 | Play upcoming + empty | ✅ Pass | Empty upcoming CTA + HISTORY locked cards. |
| 4 | Members roster | ✅ Pass | Leaderboard + PLAYERS (10) + home court. |
| 5 | Deep link lands correct Rally | ✅ Pass | `rallyapp://crew/e1000001-…101` opens hub. |
| 6 | Keyboard-safe chat | N/T | Composer not exercised this run. |

### Screenshots (`docs/contracts/screenshots/module-rally-hub/`)

- `01-chat-tab.png`, `02-play-tab-host.png`, `03-members-tab.png`

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | — | — |
