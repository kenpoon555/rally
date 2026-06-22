# Flow — Auth & onboarding

**Contract id:** `flow-auth-onboarding`  
**Status:** **Partial** — tier 2 picky P0: fresh signup legal gate silent failure (2026-06-22)  
**Screens:** `WelcomeScreen`, `LoginScreen`, `SignupScreen`, `TosAcceptanceGate`, `AuthContext`  
**Related code:** `src/context/AuthContext.tsx`, `src/services/pendingDeepLinkService.ts`, coach marks / onboarding flags

## Purpose

New and returning users sign in reliably; pending invite deep links replay after auth; first-run coach marks do not block core navigation.

North-star: **Sign out → open invite link → sign in → invite completes without second manual link.**

## Demo setup

1. Magic link or demo login on linked preview.
2. Prepare `group-invite` and `game-invite` URLs before sign-out test.

## Required states

| State | Must show |
|-------|-----------|
| **Welcome** | Login / signup paths |
| **Signed out + deep link** | Auth gate + pending link stored |
| **Post-login replay** | Pending invite processed once |
| **Returning user** | Session restore — no stuck splash |
| **Bootstrap timeout** | Cold start shows Welcome within ~12s even if session/profile hang; stale local session cleared |
| **Onboarding coach marks** | Dismissible; flags persist in AsyncStorage |
| **Legal gate (Before you play)** | Checkbox + Continue persists legal acceptance to profile — navigates to main app on success |

## Pass/fail checklist

### Legal gate (P0 — tier 2 picky)

- [ ] Fresh signup → **Before you play**: checking box + **Continue** navigates to main app (Today or permissions)
- [ ] Profile legal acceptance write failure shows **user-facing error + retry** — not silent no-op
- [ ] Metro/network failure on `acceptLegalTerms` does not trap user on legal modal indefinitely

### Auth mechanics

- [ ] `auth/callback` deep link sets session
- [ ] Pending deep link cleared after successful replay
- [ ] Double replay does not join twice / crash
- [ ] Sign out from Profile clears inbox realtime subscriptions safely
- [ ] Cold launch on iPad (iPhone compatibility): Welcome or main UI within 12s — no infinite spinner
- [ ] OAuth / magic link errors show user-facing message

## Screenshots required

`docs/contracts/screenshots/flow-auth-onboarding/` — welcome, auth gate, post-login landing.

## Out of scope

- Full Loop A checklist (see `flow-invite-to-rally.md`) — this contract focuses on auth mechanics only

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Fresh signup legal gate silent failure — `Network request failed` on profile update; Continue no-op | Builder B7 |

## Related

- [flow-invite-to-rally.md](./flow-invite-to-rally.md) — end-to-end invite loop
