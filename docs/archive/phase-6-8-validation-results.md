# Phase 6-8 Validation Results

Last updated: 2026-05-06

This file tracks execution status for Phase 6 (flexible matching), Phase 7 (review + identity), and Phase 8 (chat).

---

## Automated verification (CI bundle — 2026-05-06)

| Check | Status |
| ----- | ------ |
| `./scripts/verify-release-bundle.sh` | PASS |

DB smoke checks below remain valid for schema/RPC presence. **Device validation** rows still require manual execution on iOS and Android hardware.

---

## Environment

- Project: `Rally`
- Supabase project id: `casljueycxsqexpkdiuq`
- Migration status:
  - `003_flexible_matching`: applied
  - `004_reviews_and_chat_retry`: applied
  - `004_reviews_and_chat_policy_hardening`: applied
  - `005_profile_preferences`: applied
- Planned run window: next 2-3 days.

## Platform Pass Matrix

| Track | Status | Notes |
| ----- | ------ | ----- |
| Automated unit + lint bundle | **PASS** | 2026-05-06 |
| iOS — Phase 6–8 device cases | Pending | Use phase-6/7/8 checklists |
| Android — Phase 6–8 device cases | Pending | Use phase-6/7/8 checklists |

Legacy:

- [ ] iOS all cases passed
- [ ] Android all cases passed

## Phase 6: Flexible Matching

- Checklist: `docs/phase-6-flexible-matching-validation-checklist.md`
- DB smoke (verified 2026-02-27):
  - `activities` includes `scheduling_mode`, `match_status`, window/finalization fields. ✓
  - `activity_candidate_locations` table exists. ✓
  - `activity_participant_preferences` table exists. ✓
  - `finalize_activity_best_slot` function exists. ✓
- Device validation:
  - [ ] Host finalize flow tested on iOS.
  - [ ] Host finalize flow tested on Android.
  - [ ] Participant preference submission tested on both platforms.

### How to run Phase 6 device validation

1. **Preconditions:** Two+ test accounts (A = host, B/C = participants). At least three `activity_locations` for a sport (e.g. basketball). App built with latest code; migration `003_flexible_matching` is applied (already verified above).
2. **Open the checklist:** `RallyApp/docs/phase-6-flexible-matching-validation-checklist.md`.
3. **Run in order on each platform (iOS then Android):**
   - **Case 1:** Account A → Create Activity → choose **flexible** → set time window (e.g. 18:00–21:00), duration, 1–3 candidate locations → Publish. Confirm activity is `scheduling_mode = flex`, candidate locations visible in detail.
   - **Case 2:** Account B/C join the activity (join request → host approves). Each submits earliest/latest start + preferred location. Refresh detail; confirm one preference per user, no duplicates; host sees submission progress.
   - **Case 3:** Account A taps finalize. Re-open activity on all accounts; confirm `match_status = finalized`, start time and location set, `finalized_at` / `finalized_by` set.
   - **Case 4:** With same preferences, trigger finalize again (or call RPC in SQL editor); result should be identical (deterministic).
   - **Case 5:** With a non-participant account, try to insert/update preferences; confirm blocked. With participant B, try editing C’s preference; confirm blocked.
4. **Optional verification SQL** (Supabase SQL Editor): use the three queries in the checklist (activities, activity_candidate_locations, activity_participant_preferences) to spot-check data after each case.
5. **Record results here:** Check the three device-validation boxes above when done; add a short “Phase 6 device validation” note with pass/fail and any defects in a new subsection below if needed.

## Phase 7: Review + Identity

- Checklist: `docs/phase-7-review-identity-validation-checklist.md`
- DB smoke (verified 2026-02-27):
  - [x] `player_reviews` table exists.
  - [x] `profile_review_stats` view exists.
  - [x] `can_view_profile_identity` function exists.
- Device validation:
  - [ ] Case 1: Identity hidden before confirmation (iOS / Android).
  - [ ] Case 2: Identity reveals after finalization; non-participants still anonymized (iOS / Android).
  - [ ] Case 3: Friends always see friend identity (iOS / Android).
  - [ ] Case 4: One review per activity pair; duplicate submission blocked (iOS / Android).
  - [ ] Case 5: Score hidden until 5 reviews, visible at 5+ (iOS / Android).
  - [ ] Case 6: Review RLS — non-participant cannot insert; user can update only own review (SQL or app).
- Defects / notes: _(add any failures or observations here)_

## Phase 8: Chat

- Checklist: `docs/phase-8-chat-validation-checklist.md`
- DB smoke (verified 2026-02-27):
  - `conversations`, `conversation_members`, `messages` exist; RLS enabled.
  - RPCs exist: `get_or_create_direct_conversation`, `create_activity_group_conversation`.
- Device validation:
  - [ ] iOS: Friend direct chat + activity group chat + realtime + unread (Cases 1–3, 5).
  - [ ] Android: Friend direct chat + activity group chat + realtime + unread (Cases 1–3, 5).
  - [ ] RLS (Case 4): non-member cannot read/send; users only edit/delete own messages.
  - [ ] Leave (Case 6): optional until UI exists; or test via SQL.
- Notes: (add pass/fail and any defects here)

## Regression Status

- Phase 3 reference: `docs/phase-3-validation-results.md`
- Phase 4 checklist: `docs/phase-4-notifications-validation-checklist.md`
- Current state:
  - SQL/query health checks pass.
  - Mobile end-to-end notification and final UX regression still pending manual run.
