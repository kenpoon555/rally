# Flow — Game room (chat + roster actions)

**Contract id:** `flow-game-room`  
**Status:** Draft — validate before production; **gtm1 adjunct** if groups use Inbox chat  
**Screens:** `ChatThreadScreen`, `GameRoomHeader`, `GameRoomFooter`  
**Related:** [flow-rally-session.md](./flow-rally-session.md) (hub Play tab path — primary GTM 1)  
**Related code:** `src/components/GameRoomActionBar.tsx`, `src/pages/Chat/ChatThreadScreen.tsx`, `src/services/gameCardSessionActions.ts`

## Purpose

Players coordinate in the game room chat: roster strip, I'm in / lock / nudge, join requests, and exit paths — without duplicate action logic or chat regressions.

North-star: **Approved joiner opens game chat → confirms I'm in → host locks roster → chat shows locked state.**

## Demo setup

1. Same seeds as Loop B (`seed-monrovia-basketball-rally-demo`).
2. Host: `marcus@rally-mvrhoops.demo` — open game chat from Rally Play or Activity detail.
3. Member: `@kunyu` — approved on session, not ready.

## Required states

| State | Role | How to reach | Must show |
|-------|------|--------------|-----------|
| **Expanded header** | Both | Open game chat | Court, time, ready count, roster avatars |
| **Collapsed header** | Both | Collapse details | One-line summary; tap to expand |
| **Member I'm in** | Member | Footer actions | Primary I'm in; undo with confirm |
| **Host lock** | Host | All ready per policy | Lock roster enabled; success → finalized strip |
| **Crew join** | Rally member not on roster | Crew game with spots | Join / waitlist CTA |
| **Archived chat** | Post-grace | Past game | Read-only copy + back to chats |

## Pass/fail checklist

### Stability
- [ ] No redbox opening game chat from Inbox or detail
- [ ] Realtime join request updates without manual refresh

### Shared session actions
- [ ] Join crew, I'm in, undo, lock, nudge use `gameCardSessionActions` (not duplicated alerts)
- [ ] Lock blocked when roster empty (host alert)

### UX
- [ ] Collapsed bar readable on small screens
- [ ] Game card link opens Activity detail
- [ ] Exit row matches host vs member vs finalized rules

## Screenshots required

Save to `docs/contracts/screenshots/flow-game-room/`:

1. `01-expanded-header.png`
2. `02-member-im-in.png`
3. `03-host-lock.png`
4. `04-finalized-footer.png`

## Out of scope

- Fill-in suggestions / need-players board (separate contract later)
- Mini-tournament panel

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
