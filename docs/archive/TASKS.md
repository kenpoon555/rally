# Docs Task Index (Claude-Actionable)

**Use this to avoid rate limits:** Pick **one** task per session. Paste the task title (bold line) as the instruction. When done, check the box and move on.

**Stack:** This app is **React Native** (bare), not Expo. Location uses the **expo-location** library (works in bare RN). Do not use `expo start`; use `npx react-native run-android` / `run-ios` and `npm start` for Metro.

---

## How to use

1. Choose one unchecked task below.
2. Tell Claude: *"Do the task: [exact task title]"* (or reference its ID).
3. Claude opens only the linked doc/section — minimal context.
4. When the task is done, check the box and log results in the doc if required.
5. Start a new session for the next task.

---

## Release blockers (from triage-results.md)

Before release, address these **open** items from `docs/triage-results.md` § Release blockers summary:

| ID | Bucket | Blocker |
|----|--------|---------|
| DC-7 | Data correctness | Phase 3 device QA (Cases 1–2, 5–6) not fully run on both platforms |
| DC-1 | Data correctness | Phase 6 device QA (flexible finalization) not run |
| DC-5, DC-6 | Data correctness | Phase 7 review constraints not validated on device |
| PV-1, PV-2 | Privacy | Anonymous-until-confirmed identity not validated on device |
| PV-3 | Privacy | Chat RLS not validated on device |
| CR-4 | Crashes | Push cold-start handler not tested (deferred → [post-preview-testing-backlog.md](post-preview-testing-backlog.md)) |
| Phase 4 Cases 1–5 | Crashes/UX | Notification flow not run on device (deferred → post-preview) |

**Closed:** ~~PV-6~~ location debug ingest removed from `locationService.ts` (2026-03-15).

Fix order: Data correctness → Privacy → Crashes → UX polish.

---

## Setup & config

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [x] | **Add Firebase config files** | [current-setup-app-guide.md §7](current-setup-app-guide.md) | Add `GoogleService-Info.plist` (iOS) and `google-services.json` (Android). | Both files in place; app builds. |
| [x] | **Populate .env from .env.example** | [env-and-api-keys.md](env-and-api-keys.md), [current-setup-app-guide.md §7](current-setup-app-guide.md) | Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`; optional Places/Maps keys. | App starts without "Missing Supabase configuration". |
| [x] | **Fix Android Map "API key not found"** | [env-and-api-keys.md § API key not found](env-and-api-keys.md) | Enable Maps SDK for Android on key; set key in .env; rebuild. | Map tab shows tiles on Android. |
| [ ] | **Validate real-device push path (after preview build)** | [post-preview-testing-backlog.md § Phase 4](post-preview-testing-backlog.md) | Preview on physical iPhone; APNs in Firebase; Cases 1–5. **Defer until post-preview.** | Token in DB; join push received; tap opens Activity Detail. |

---

## Phase 3: Partner matching (VALIDATION_PLAN.md)

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Run Phase 3 Case 1 – Geolocation permission + live location** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 1 on one platform (RN + expo-location). **Android:** Fixed 2026-03 (Expo modules + getCurrentPositionAsync + getLastKnownPositionAsync fallback); Case 1 pass and notes in VALIDATION_PLAN. After re-enabling permission, pull-to-refresh if needed; location and Create activity work; Location debug panel shows success. | Status and notes written; pass/fail clear. |
| [ ] | **Run Phase 3 Case 2 – Geofence detection prompt** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 2 steps on one platform; fill Status \| Notes. | Status and notes written; pass/fail clear. |
| [ ] | **Run Phase 3 Case 3 – Create activity + Discover listing** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 3 steps on one platform; fill Status \| Notes. | Status and notes written; pass/fail clear. |
| [ ] | **Run Phase 3 Case 4 – Join request flow (two accounts)** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 4 steps on one platform; fill Status \| Notes. | Status and notes written; pass/fail clear. |
| [ ] | **Run Phase 3 Case 5 – Friend request + accept** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 5 steps on one platform; fill Status \| Notes. | Status and notes written; pass/fail clear. |
| [ ] | **Run Phase 3 Case 6 – Quick Match behavior** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md) | Execute Case 6 steps on one platform; fill Status \| Notes. | Status and notes written; pass/fail clear. |
| [ ] | **Record Phase 3 results in phase-3-validation-results.md** | [VALIDATION_PLAN.md § Results Logging](VALIDATION_PLAN.md) | Create/update `docs/phase-3-validation-results.md` with platform pass matrix and case outcomes. | File exists; Platform Matrix and case notes filled. |

---

## Phase 4: Notifications

**Implementation:** done (2026-05-29). **Device QA:** deferred → [post-preview-testing-backlog.md](post-preview-testing-backlog.md).

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Run Phase 4 Case 1 – Permission prompt + persisted grant** | [post-preview-testing-backlog.md](post-preview-testing-backlog.md) | After preview on physical device. | Status and notes written. |
| [ ] | **Run Phase 4 Case 2 – Token in user_device_tokens** | [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md) | Execute Case 2; run verification SQL; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 4 Case 3 – Token refresh lifecycle** | [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md) | Execute Case 3; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 4 Case 4 – Foreground notification handling** | [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md) | Execute Case 4; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 4 Case 5 – Background + cold start handling** | [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md) | Execute Case 5; fill Status \| Notes. | Status and notes written. |
| [ ] | **Fill Phase 4 run template and platform matrix** | [phase-4-notifications-validation-checklist.md § Results](phase-4-notifications-validation-checklist.md) | Add run-date block with Case 1–5 pass/fail and Issues. | Template filled; exit criteria checkable. |

---

## Phase 6: Flexible matching

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Run Phase 6 Case 1 – Host creates flexible activity** | [phase-6-flexible-matching-validation-checklist.md](phase-6-flexible-matching-validation-checklist.md) | Execute Case 1 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 6 Case 2 – Participants submit preference windows** | [phase-6-flexible-matching-validation-checklist.md](phase-6-flexible-matching-validation-checklist.md) | Execute Case 2 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 6 Case 3 – Host finalizes best slot** | [phase-6-flexible-matching-validation-checklist.md](phase-6-flexible-matching-validation-checklist.md) | Execute Case 3 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 6 Case 4 – Deterministic finalization** | [phase-6-flexible-matching-validation-checklist.md](phase-6-flexible-matching-validation-checklist.md) | Execute Case 4; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 6 Case 5 – Access control on preferences** | [phase-6-flexible-matching-validation-checklist.md](phase-6-flexible-matching-validation-checklist.md) | Execute Case 5 (RLS); fill Status \| Notes. | Status and notes written. |
| [ ] | **Record Phase 6 device validation in phase-6-8-validation-results.md** | [phase-6-8-validation-results.md § Phase 6](phase-6-8-validation-results.md) | Check device validation boxes; add defects/notes. | Phase 6 section updated. |

---

## Phase 7: Review + identity

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Run Phase 7 Case 1 – Identity hidden before confirmation** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 1 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 7 Case 2 – Identity reveals after finalization** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 2 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 7 Case 3 – Friends always see friend identity** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 3; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 7 Case 4 – Review submission constraints** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 4; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 7 Case 5 – Review visibility threshold (5+)** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 5; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 7 Case 6 – Review access controls** | [phase-7-review-identity-validation-checklist.md](phase-7-review-identity-validation-checklist.md) | Execute Case 6; fill Status \| Notes. | Status and notes written. |
| [ ] | **Record Phase 7 results in phase-6-8-validation-results.md** | [phase-6-8-validation-results.md § Phase 7](phase-6-8-validation-results.md) | Check device validation boxes; add defects/notes. | Phase 7 section updated. |

---

## Phase 8: Chat

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Run Phase 8 Case 1 – Activity group conversation auto-create** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 1 on one platform; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 8 Case 2 – Friend direct conversation bootstrap** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 2; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 8 Case 3 – Realtime send/receive** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 3; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 8 Case 4 – Membership/RLS enforcement** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 4; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 8 Case 5 – Read state and unread indicators** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 5; fill Status \| Notes. | Status and notes written. |
| [ ] | **Run Phase 8 Case 6 – Leave conversation behavior** | [phase-8-chat-validation-checklist.md](phase-8-chat-validation-checklist.md) | Execute Case 6 (or SQL test); fill Status \| Notes. | Status and notes written. |
| [ ] | **Record Phase 8 results in phase-6-8-validation-results.md** | [phase-6-8-validation-results.md § Phase 8](phase-6-8-validation-results.md) | Check device validation boxes; add defects/notes. | Phase 8 section updated. |

---

## Triage & release

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [x] | **Run triage and populate triage-results.md** | [triage-defects-checklist.md](triage-defects-checklist.md), [triage-results.md](triage-results.md) | Gather defects from phase/checklist/backlog docs; classify; list in triage-results.md. | All sources scanned; defects in correct bucket with status. |
| [x] | **Complete release-readiness Security and Config** | [release-readiness-checklist.md § Security](release-readiness-checklist.md) | Verify .env, no hardcoded secrets, Supabase/Places from env. | All Security checkboxes done. |
| [ ] | **Complete release-readiness Core Regression** | [release-readiness-checklist.md § Core Regression](release-readiness-checklist.md) | Run Auth, Discover, Map, Friends, Activity, Geofence on iOS + Android. | All Core Regression checkboxes done. |
| [ ] | **Complete release-readiness Notifications** | [release-readiness-checklist.md § Notifications](release-readiness-checklist.md) | Permission, token insert/refresh, foreground/background/cold-start. | All Notifications checkboxes done. |
| [ ] | **Complete release-readiness Build and Quality Gates** | [release-readiness-checklist.md § Build](release-readiness-checklist.md) | Lint, test, iOS/Android debug build. | Lint/test/build items done or documented. |

---

## Bugfix: Android location

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [x] | **Fix Android location timeout/crash** | [ANDROID-LOCATION-ISSUE-CONTEXT.md](ANDROID-LOCATION-ISSUE-CONTEXT.md) | **Fixed 2026-03:** (1) Expo modules on Android. (2) getCurrentPositionAsync + getLastKnownPositionAsync fallback. **Follow-up 2026-03-17:** `getLastKnownPositionAsync` returned null because `requiredAccuracy: 500` filtered out emulator network/wifi positions. Relaxed to 10000m + no-constraint final fallback added. Re-test needed. | No stop/crash; location works on Android. |
| [x] | **Remove Android location debug instrumentation** | [ANDROID-LOCATION-ISSUE-CONTEXT.md § Debug instrumentation](ANDROID-LOCATION-ISSUE-CONTEXT.md) | Removed `agentLog`, debug ingest, and `#region agent log` from `locationService.ts`. | No debug ingest in locationService. |

---

## Sport-specific matching (config + docs)

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [x] | **Lock pickleball-only MVP + fixed game default** | [sport-matching-profiles.md](sport-matching-profiles.md), [ROADMAP.md](../ROADMAP.md) | `SPORT_METADATA` Pickleball `launchEnabled`; fixed default scheduling | Discover/Create Game pickleball-first; flex secondary |
| [x] | **Document Phase 2 `fastFixed` + chat MVP boundary + agent workstreams** | [phase2-fast-fixed-matching.md](phase2-fast-fixed-matching.md), [chat-mvp-boundary.md](chat-mvp-boundary.md), [agent-workstreams-sport-matching.md](agent-workstreams-sport-matching.md) | Planning only | Docs exist and link from backlog |

## Backlog (v2–v4)

| Done | Task | Doc | Scope | Acceptance |
|------|------|-----|--------|------------|
| [ ] | **Add chat moderation/report flow** | [current-setup-app-guide.md §7](current-setup-app-guide.md), [v2-v4-implementation-backlog.md](v2-v4-implementation-backlog.md) | Implement moderation/report for chat (V2.1-4 pending). | Report flow exists; documented in backlog. |
| [ ] | **Add abuse controls for reviews** | [v2-v4-implementation-backlog.md § V2.1-2](v2-v4-implementation-backlog.md) | Implement abuse controls for post-match reviews. | Abuse controls in place; doc updated. |
| [x] | **Create phase-3-validation-results.md** | [VALIDATION_PLAN.md](VALIDATION_PLAN.md), [current-setup-app-guide.md](current-setup-app-guide.md) | Add file with Platform Matrix and Case results (or confirm it exists and format). | File present; matches Results Logging spec. |

---

## Reference-only (no discrete task)

- **HANDOFF-sport-matching.md** — What changed for the Phase 1 sport wedge, how to test (simulator-first), copy-paste prompt for the next agent.
- **current-setup-app-guide.md** — Setup snapshot, architecture, test cases (TC-*). Use for context; specific actions are in TASKS above.
- **ANDROID-LOCATION-ISSUE-CONTEXT.md** — Android location: resolution (2026-03) and historical context. Why getCurrentPosition succeeds now (Expo modules + fallback); Create activity and Location debug panel work.
- **debug-android-cold-start-location.md** — Historical fix (no watchPosition on Android). Re-read only if regressions appear.
- **CLAUDE.md** — Repo rules and commands; agents follow this when coding.

---

*Last updated: 2026-03-17. Android location follow-up fix: relaxed getLastKnownPositionAsync requiredAccuracy 500→10000 + no-constraint final fallback (locationService.ts). iOS Case 3 (Create activity) partially confirmed. Docs updated: phase-3-validation-results.md, ANDROID-LOCATION-ISSUE-CONTEXT.md.*
