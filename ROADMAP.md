# RallyApp Roadmap

Last updated: 2026-02-23 (validation sprint prep refresh)

## Product Direction

- Rally helps users find sport partners quickly with less friction.
- The app encourages a healthier lifestyle through consistent activity and stronger social trust loops.
- Core success metric for MVP: a user can discover, join, and play with a partner in minutes.
- Next success metric: a group can converge on the best time/location with minimal coordination overhead.

## Current Status

- New Supabase project created and wired into app config.
- Core auth, activity, map, friends, and notification foundations are implemented.
- Deep-link auth callback support added for `rallyapp://auth/callback`.
- Supabase REST trailing-slash route issue moved to closed state with base URL normalization fix.
- Debug instrumentation noise removed from auth/profile service flow.
- Create Activity screen now supports real activity creation flow.
- Phase 1 complete.
- Phase 2 complete.
- Phase 3 currently in validation/testing (geofence, create/list activity, join-request, friend accept).
- Phase 3 checklist added: `docs/phase-3-partner-matching-validation-checklist.md`.
- Phase 4 notification implementation checklist added: `docs/phase-4-notifications-validation-checklist.md`.
- Release readiness checklist added: `docs/release-readiness-checklist.md`.
- V2-V4 implementation backlog updated for flexible matching, reviews, profile upgrades, and chat.

## Decision Lock (2026-02-22)

- Activity creation default moves to **flexible optimization**:
  - Host provides broad constraints (time window, duration, candidate locations).
  - Players submit preferences.
  - System finalizes best time and location.
- Identity model is **anonymous until confirmed**:
  - Before confirmation: users see anonymized participant identity.
  - After confirmation: identities unlock for confirmed participants.

## What To Expect In App Right Now

### Working Now (User-Visible)

- Auth flow works: signup, login, logout, profile auto-create.
- Discover tab shows activity feed with loading/empty states, sport filter chips, and `Quick Match`.
- Map tab shows activity pins plus nearby sports-location pins, with fallback region and `Start Here` CTA.
- Friends tab supports friends list, incoming/outgoing requests, search/add flow, and empty-state CTA.
- Create Activity flow is live from CTA paths (`Create Activity`, `Start Here`, `Quick Match` fallback).
- Activity detail supports join requests; host can approve/reject pending requests.

### In Progress / Not Fully Validated Yet

- End-to-end 2-account partner matching pass for all Phase 3 cases.
- Geofence behavior consistency across different real-world locations.
- Notification delivery (Phase 4 items still pending).

## Home Screen UX (Current + Near-Term)

The home area should feel alive immediately after login. If empty, show clear CTA cards and onboarding tips.

### Tab 1 - Discover

Current:

- Nearby activities by sport.
- Activity cards with host, time, distance, and open slots.
- Filters and `Quick Match`.

Near-term extension:

- Show activity state: `collecting preferences` vs `finalized`.
- Show user preference mismatch banner when selected activity differs from saved defaults.
- Add profile icon entry point for fast preference updates.

### Tab 2 - Map

Current:

- Live map centered on current location.
- Pins for nearby activities and sports locations.
- Bottom sheet list synced with pins.
- `Start Here` flow to create an activity.

Near-term extension:

- Candidate locations shown during flexible activity setup/finalization.

### Tab 3 - Friends

Current:

- Friend list with status: available, playing, offline.
- Incoming/outgoing friend requests.
- Add/search flow.

Near-term extension:

- 1:1 friend chat entry.
- Friend identity always visible after accepted friendship.

## Master Plan

### Phase 1 - Stability and Auth Baseline

- [x] Verify signup/login/logout on iOS and Android end-to-end (run `docs/archive/auth-profile-validation-checklist.md`).
- [x] Validate profile auto-create behavior from authenticated session (Case 2 in checklist).
- [x] Remove noisy debug instrumentation from `src/services/userService.ts`.
- [x] Fix and align setup docs (`profiles` table naming and current flow).

### Phase 2 - Home Tabs MVP (Make Screens Useful)

- [x] Build `Discover` tab data fetch + loading + empty states.
- [x] Build `Map` tab activity pins + location fallback + empty states.
- [x] Build `Friends` tab list + friend requests + empty states.
- [x] Add clear onboarding hints for first-time users.
- [x] Ensure each tab has at least one primary CTA.

### Phase 3 - Core Partner Matching Flows

- [ ] Validate geolocation permissions and geofence detection (Case 1-2 in `docs/phase-3-partner-matching-validation-checklist.md`).
- [ ] Validate activity creation and listing in nearby feed (Case 3 in checklist).
- [ ] Validate join-request flow between two accounts (Case 4 in checklist).
- [ ] Validate friends request/accept flow (Case 5 in checklist).
- [x] Add `Quick Match` action (find partner by sport + time + distance).

### Phase 4 - Notifications

- [ ] Complete Firebase console setup (iOS + Android config files).
- [x] Validate token registration in `user_device_tokens`.
- [x] Validate foreground/background push notification handling.

### Phase 5 - Hardening and Release Readiness

- [x] Add integration test checklist for auth + profile lifecycle (`docs/archive/auth-profile-validation-checklist.md`).
- [x] Add production-safe key/config strategy (remove hardcoded secrets).
- [x] Improve error surfaces for auth/profile failures.
- [ ] Run regression pass on iOS and Android.

### Phase 6 - Flexible Match Optimization (V2.1)

- [x] Add flexible activity mode with host constraints (time window, duration, candidate locations).
- [x] Add participant preference submission flow and finalization RPC scoring.
- [x] Update Discover/Activity detail surfaces to show `collecting` and `finalized` states.
- [x] Add deterministic finalization validation checklist and sign-off.

### Phase 7 - Trust Layer: Reviews + Identity Privacy (V2.1)

- [x] Add post-match review system with one-review-per-pair-per-activity guard.
- [x] Add score threshold visibility (`>= 5` reviews before public aggregate score).
- [x] Enforce anonymous-until-confirmed rules in query layer and RLS.
- [ ] Add abuse controls (cooldown/edit window/report path).

### Phase 8 - Profile + Preference Center (V2.1)

- [x] Add profile section with picture, nickname, and default play preferences.
- [x] Add home profile icon entry and preference summary card.
- [x] Prefill activity creation from saved defaults.
- [x] Prompt users when selected activity differs from saved preference profile.

### Phase 9 - Chat Foundation (V2.1)

- [x] Auto-create group chat when activity is finalized/confirmed.
- [x] Add friend 1:1 chat threads from Friends tab.
- [x] Add unread badges and realtime delivery checks.
- [ ] Add chat moderation baseline (block/report).

## Product Evolution Plan

### V1 (Now) - MVP Partner Finding

- Goal: help users quickly find someone to play with.
- Focus: discover/map/friends tabs with smooth activity join flow.
- Must-have: low-friction onboarding and obvious CTAs on empty screens.

### V2.1 - Match Optimization + Identity Trust

- Flexible activity setup and optimization to reduce host coordination burden.
- Anonymous-until-confirmed participant identity.
- Review system with minimum review threshold before score display.
- Profile + preference center and preference-aware homepage.
- Activity and friend chat foundation.

### V3 - Community Growth + Programs

- Tournament mode foundation and casual competitive formats.
- Better group orchestration and community retention loops.
- Local program structure for recurring activity communities.

### V4 - Owned Facilities + Membership Vision

- Stage A: use rally data to identify low-maintenance, high-demand sports formats.
- Stage B: run partner-venue pilots with measured cost and utilization targets.
- Stage C: launch Rally-managed affordable sport spaces (for example, pool/gym/court bundles).
- Stage D: unify into one Rally membership with behavior incentives and maintenance credits.
- Any biometric or facial-recognition initiative requires legal/privacy/security review before build.

## Known Issues Backlog

- [x] Revisit and properly fix Supabase REST trailing-slash `404` behavior.
  - Fixed by normalizing `SUPABASE_URL` once in `src/services/api/supabase.ts`.
  - Removed request-level rewrite workaround.
  - Details tracked in `issues/2026-02-supabase-rest-trailing-slash-404.md`.

## Validation Sprint Quick Start (Next 2-3 Days)

1. Run Phase 3 checklist on iOS + Android and record outcomes in `docs/phase-3-validation-results.md`.
2. Run Phase 4 notification checklist on iOS + Android and add notes in the checklist file.
3. Run Phase 6-8 checklists on iOS + Android and track pass/fail in `docs/phase-6-8-validation-results.md`.
4. Triage defects in order: data correctness -> privacy -> crashes -> UX polish.
5. Re-run failed cases after fixes and update the same results files (no separate tracking doc).
6. Keep `docs/release-readiness-checklist.md` as final go/no-go gate.
