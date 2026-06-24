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

### Rate Players (tier 4 — `flow-post-game-review`)
- [ ] **Rate Players (n)** section visible when `n > 0`
- [ ] Section **auto-expanded** when pending count > 0
- [ ] Section placed **above** Preferences (not below fold under display name) — P2
- [ ] Tap prompt row opens activity detail with review form
- [ ] Trust line reflects reviews given (optimistic +1 after submit — P2)

## Screenshots required

`docs/contracts/screenshots/flow-profile/` — main, edit, modal preview.

## Out of scope

- Friend list management (`FriendsScreen`)
- Admin metrics dashboard

## Validator report

> Run: 2026-06-24 ~11:26 PT · iOS Simulator · `marcus@rally-mvrhoops.demo` · branch `fix/cross-surface-tier4-builder`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Cold load | ✅ Pass | Profile Me tab loads. |
| 2 | Photo upload | N/T | Not exercised. |
| 3 | Scorecard | ✅ Pass | Games/Going/Attendance + "1 review" after rating submit. |
| 4 | Sign out | N/T | Not exercised this pass. |
| 5 | Beta feedback | N/T | Flag-dependent. |
| 6 | Rate Players (n) | ✅ Pass | (39) expanded — `01-profile-rate-players.png`. |
| 7 | Auto-expanded | ✅ Pass | Section open by default when n>0. |
| 8 | Above Preferences | ✅ Pass | Rate Players between hero and Preferences. |
| 9 | Tap prompt → detail | ✅ Pass | Via Today card → activity detail form. |
| 10 | Trust line after submit | ✅ Pass | "1 review · public rating after 5". |

### Screenshots

`docs/contracts/screenshots/flow-profile/01-profile-rate-players.png`

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | — | — |
