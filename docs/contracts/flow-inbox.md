# Flow — Inbox (Chats tab)

**Contract id:** `flow-inbox`  
**Status:** Draft — sprint prep  
**Screens:** `ChatListScreen`  
**Related code:** `src/pages/Chat/ChatListScreen.tsx`, `src/hooks/useChatInbox.ts`

## Purpose

User sees friend, game, and Rally threads in one inbox with filters, realtime updates, and correct navigation to chat or game room.

North-star: **Open Inbox → tap game row → game chat opens with GameRoom header/footer.**

## Demo setup

1. `@kunyu` with friend chat + at least one game chat + Rally group row (Monrovia seed).
2. Metro running; test iOS sim first.

## Required states

| Filter | Must show |
|--------|-----------|
| **All** | Mixed rows sorted by recency |
| **Friends** | DM threads only |
| **Games** | Game / activity threads |
| **Groups** | Rally crew rows |
| **Empty filter** | Empty copy — no crash |

## Pass/fail checklist

- [ ] Filters switch without losing scroll crash
- [ ] Game row opens game chat (`ChatThread` + game room chrome)
- [ ] Rally row opens `RegularsCrew` or group chat per product rules
- [ ] Unread / last message preview updates on realtime event
- [ ] Error state when inbox fetch fails (retry affordance)

## Screenshots required

`docs/contracts/screenshots/flow-inbox/` — each filter + game row open.

## Out of scope

- Push notification tap routing (see push contract / workflow)
- Message composer behavior (covered in game-room / rally-session)

## Validator report

> Run: 2026-06-22 ~01:06 PT · iOS Simulator · `marcus@rally-mvrhoops.demo` · branch `fix/overnight-jun-2026-batch`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Filters switch | ✅ Pass | Friends / Games / Rallies / Classes chips — no crash. |
| 2 | Friends empty state | ✅ Pass | Copy + empty illustration. |
| 3 | Games empty state | ✅ Pass | Archived-game copy when no active rooms. |
| 4 | Classes announcements | ✅ Pass | Beginner Badminton parent row visible. |
| 5 | Rally row → hub | ✅ Pass | API: 2 groups for marcus; hub via `rallyapp://crew/…`. Inbox filter chips get `testID=inbox-filter-*` for automation. |
| 6 | Game row → game chat | N/T | No active game rooms in inbox. |
| 7 | Error/retry | N/T | Fetch succeeded (no error banner). |

### Screenshots (`docs/contracts/screenshots/flow-inbox/`)

- `01-friends-filter-empty.png`, `02-games-filter-empty.png`

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | — | — |
