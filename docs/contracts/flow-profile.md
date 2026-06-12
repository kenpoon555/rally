# Flow — Profile

**Contract id:** `flow-profile`  
**Status:** Draft — sprint prep  
**Screens:** `ProfileScreen`, `PlayerProfileModal`  
**Related code:** `src/pages/Profile/ProfileScreen.tsx`, `src/components/PlayerProfileModal.tsx`

## Purpose

User views and edits their profile, sport preferences, and trust signals; hosts can access admin/beta tools when entitled.

North-star: **Profile loads → stats/scorecard visible → edit saves → persists after relaunch.**

## Demo setup

1. `@kunyu` and `marcus@rally-mvrhoops.demo` on linked preview.
2. Profile with at least one completed game for scorecard rows (if seeded).

## Required states

| State | Must show |
|-------|-----------|
| **Own profile** | Avatar, username, sport lines, scorecard section |
| **Edit profile** | Save succeeds; validation on empty username |
| **Sign out** | Returns to auth — session cleared |
| **View other player** | Modal from game card — trust line, no private fields |

## Pass/fail checklist

- [ ] Cold load < 3s on sim
- [ ] Photo upload / picker does not crash (if enabled)
- [ ] Scorecard matches activity history (no stale mock data)
- [ ] Sign out clears pending deep link replay appropriately
- [ ] Beta feedback entry navigates when flag on

## Screenshots required

`docs/contracts/screenshots/flow-profile/` — main, edit, modal preview.

## Out of scope

- Friend list management (`FriendsScreen`)
- Admin metrics dashboard

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Not validated yet | — |
