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

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
