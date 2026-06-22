# Flow — Auth & onboarding

**Contract id:** `flow-auth-onboarding`  
**Status:** **Partial** — Build 10: legal gate error UX + pre-auth terms cross-ref (`module-ugc-moderation`)  
**Screens:** `WelcomeScreen`, `LoginScreen`, `SignupScreen`, `TosAcceptanceGate`, `AuthContext`  
**Related code:** `src/context/AuthContext.tsx`, `src/services/pendingDeepLinkService.ts`, coach marks / onboarding flags  
**App Store:** Terms before register/login — see [module-ugc-moderation.md](./module-ugc-moderation.md)

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
- [ ] Profile legal acceptance write failure shows **user-facing error + retry** — not silent no-op (`testID="legal-gate-error"` visible on failure)
- [ ] Metro/network failure on `acceptLegalTerms` does not trap user on legal modal indefinitely
- [ ] **App Store 1.2:** Signup + Login show terms/community standards **before** credentials submit — [module-ugc-moderation.md](./module-ugc-moderation.md)

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

## Validator report

> Run: 2026-06-22 · queue `app-store-build-10` · sim iPhone 16

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Fresh signup → legal gate → Continue → main app | ⏳ | Legal gate UI verified; full fresh signup not completed on sim |
| 2 | Legal gate error + retry on failure | ✅ | `TosAcceptanceGate` shows `testID="legal-gate-error"` + Alert |
| 3 | Network failure does not trap user | ✅ | Error text + retry; button re-enabled after catch |
| 4 | Signup/Login terms before credentials (1.2) | ✅ | Cross-ref `module-ugc-moderation` screenshots |
| 5 | Welcome loads after sign-out | ✅ | Carousel + Get Started / I have an account |
| 6 | Age gate → signup path | ✅ | 18+ selection reaches signup form |
| 7 | Auth callback / deep link replay | ⏳ | Out of scope this queue — existing contract |
| 8 | Cold launch ≤12s | ✅ | Welcome within 2s on sim relaunch |

Screenshots: `docs/contracts/screenshots/flow-auth-onboarding/`
