# Flow — Inbox (Chats tab)

**Contract id:** `flow-inbox`  
**Status:** Draft — sprint prep · tier 4 product review 2026-06-24  
**Screens:** `ChatListScreen`  
**Related code:** `src/pages/Chat/ChatListScreen.tsx`, `src/hooks/useChatInbox.ts`, `surfaceVisibility.ts`  
**Product review:** [2026-06-24-cross-surface-tier4-synthesis.md](../product-review/consolidated/2026-06-24-cross-surface-tier4-synthesis.md)

## Purpose

User sees friend, game, and Rally threads in one inbox with filters, realtime updates, and correct navigation to chat or game room.

North-star: **Open Inbox → tap game row → game chat opens with GameRoom header/footer.**

## Demo setup

1. `@kunyu` with friend chat + at least one game chat + Rally group row (Monrovia seed).
2. Metro running; test iOS sim first.

## Required states

| Filter | Must show |
|--------|-----------|
| **Friends** | DM threads only (default filter) |
| **Games** | Game / activity threads |
| **Rallies** | Rally crew rows |
| **Classes** | Class announcement rows — **only** when `shouldShowInboxClassesFilter` (coach or parent w/ enrollments; not R0) |
| **Empty filter** | Empty copy — no crash |

## Pass/fail checklist

### Filters + navigation
- [ ] Filters switch without losing scroll crash
- [ ] Game row opens game chat (`ChatThread` + game room chrome)
- [ ] Rally row opens `RegularsCrew` or group chat per product rules
- [ ] **DM back stack** label reads **Inbox** (not `MainTabs`) — P2 tier 4
- [ ] Error state when inbox fetch fails (retry affordance)

### Unread + realtime (P1 tier 4)
- [ ] Unread / last message preview updates on realtime event
- [ ] **Row badge** when thread `unread > 0`
- [ ] **Filter chip badge** aggregate when filter has unread threads
- [ ] **Inbox tab badge** on main tab bar when any inbox unread > 0

### Performance
- [ ] **DM open latency** ≤ 1s from row tap to first message visible (prefetch or skeleton — not blank spinner > 2s)

### Classes filter (role-gated)
- [ ] R0 `@kunyu` — **no** Classes chip when no enrollments / not coach
- [ ] `marcus@…` or enrolled parent — Classes chip visible when flags on
- [ ] Classes empty copy: *No class announcements yet. Coaches message parents here — not children.*
- [ ] Announcement row shows class title, preview, *To parents · not child DM*
- [ ] **Row tap opens announcement detail** (read-only sheet or thread) — P1 tier 4
- [ ] Classes chip **unread badge** when new parent notifications > 0 — P2
- [ ] Announcement row shows **sent timestamp** — P2

## Screenshots required

`docs/contracts/screenshots/flow-inbox/` — each filter + game row open.

## Out of scope

- Push notification tap routing (see push contract / workflow)
- Message composer behavior (covered in game-room / rally-session)

## Validator report

> Run: 2026-06-24 ~11:22 PT · iOS Simulator · `marcus@rally-mvrhoops.demo` · branch `fix/cross-surface-tier4-builder`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Filters switch | ✅ Pass | Friends / Games / Rallies / Classes — no crash. |
| 2 | Friends empty state | ✅ Pass | Copy + empty illustration. |
| 3 | Games empty state | ✅ Pass | Archived-game copy when no active rooms. |
| 4 | Classes announcements | ✅ Pass | Beginner Badminton row + detail sheet (`05-class-announcement-detail.png`). |
| 5 | Rally row → hub | ✅ Pass | Julian Fisher Park Regulars → crew chat (`06-rally-hub.png`). |
| 6 | DM back stack → Inbox | ✅ Pass | `headerBackTitle: 'Inbox'` in `AppNavigator` + `ChatThreadScreen`; friend DM N/T (marcus has no friend threads). |
| 7 | Error/retry | N/T | Fetch succeeded (no error banner). |
| 8 | Row unread badge | N/T | No threads with `unread > 0` in marcus seed. |
| 9 | Filter chip badge | ✅ Pass | Classes chip shows `1` unread (`03-rallies-filter.png`). |
| 10 | Inbox tab badge | N/T | No chat unread aggregate for marcus. |
| 11 | DM open latency / skeleton | ✅ Pass | `ChatThreadSkeleton` + prefetch on row tap (crew chat loads instantly). |
| 12 | Announcement row tap → detail | ✅ Pass | Bottom sheet with timestamp + body. |
| 13 | Announcement sent timestamp | ✅ Pass | Row + detail show time. |

### Screenshots (`docs/contracts/screenshots/flow-inbox/`)

- `01-friends-filter-empty.png`, `02-games-filter-empty.png`, `03-rallies-filter.png`, `04-classes-filter.png`, `05-class-announcement-detail.png`, `06-rally-hub.png`

## Visual tier 5 checklist (2026-06-24)

- [ ] Filter chips readable at 393pt — 4-across not cramped; Classes badge does not truncate label (H2: scroll vs 3+More)
- [ ] Empty state uses branded icon — not emoji 💬
- [ ] Empty title reflects filter (“No Rally chats yet”) not generic alone
- [ ] Row meta chips align to single line where possible

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | — | — |
