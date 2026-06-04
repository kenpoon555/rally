# Triage Results (Defect Backlog)

Last updated: 2026-03-15

Prioritized defect list from validation steps 1–6 and Known Issues. Fix order: **Data correctness → Privacy → Crashes → UX polish.**

Use `docs/triage-defects-checklist.md` to run triage and keep this file updated.

---

## Sources scanned

| Source | Status |
|--------|--------|
| `docs/archive/auth-profile-validation-checklist.md` | Run 2026-02-27; Cases 1–4, 6 passed |
| `docs/VALIDATION_PLAN.md` (Phase 3 cases) | Not run yet |
| `docs/phase-4-notifications-validation-checklist.md` | Not run yet |
| `docs/phase-6-flexible-matching-validation-checklist.md` | Not run yet |
| `docs/phase-7-review-identity-validation-checklist.md` | Not run yet |
| `docs/phase-8-chat-validation-checklist.md` | Not run yet |
| `docs/phase-6-8-validation-results.md` | DB smoke passed; device validation pending |
| `docs/release-readiness-checklist.md` | Most items unchecked |
| `docs/v2-v4-implementation-backlog.md` | Device QA and some stories pending |
| `docs/ANDROID-LOCATION-ISSUE-CONTEXT.md` | Resolved 2026-03 |
| `docs/TASKS.md` | Open tasks reviewed |

---

## 1. Data correctness

| # | Summary | Source | Platform | Status |
|---|---------|--------|----------|--------|
| DC-1 | Flexible activity finalization (Phase 6): host finalize flow, preference submission, deterministic output, and preference RLS **never validated on device**. Risk that `finalize_activity_best_slot` writes wrong slot or allows unauthorized writes. | Phase 6 checklist / phase-6-8-validation-results.md | Both | **Open – pending device QA** |
| DC-2 | Activity group chat auto-create (Phase 8 Case 1): duplicate group conversations may be created per activity if `create_activity_group_conversation` RPC is called more than once. Never tested on device. | Phase 8 checklist | Both | **Open – pending device QA** |
| DC-3 | Direct friend conversation deduplication (Phase 8 Case 2): `get_or_create_direct_conversation` may create a new thread on each call rather than reusing existing one. Never tested on device. | Phase 8 checklist | Both | **Open – pending device QA** |
| DC-4 | Duplicate preference rows (Phase 6 Case 2): preference submission may insert duplicates instead of upserting. Never tested on device. | Phase 6 checklist | Both | **Open – pending device QA** |
| DC-5 | Duplicate review rows (Phase 7 Case 4): duplicate review submission for same activity/reviewer/reviewed pair not verified to be blocked on device. | Phase 7 checklist | Both | **Open – pending device QA** |
| DC-6 | Review score threshold (Phase 7 Case 5): aggregate score may surface before 5-review threshold is met, or remain hidden after 5+ reviews. Never tested on device. | Phase 7 checklist | Both | **Open – pending device QA** |
| DC-7 | Phase 3 results file was missing; Phase 3 device QA (Cases 2–6) not run. | TASKS.md / release-readiness-checklist.md | Both | **Partial – file created 2026-03-15; QA not run** |

---

## 2. Privacy

| # | Summary | Source | Platform | Status |
|---|---------|--------|----------|--------|
| PV-1 | Anonymous-until-confirmed identity (Phase 7 Cases 1–3): full username/photo may be visible to non-confirmed participants before finalization. `can_view_profile_identity` DB function exists but **never validated on device**. | Phase 7 checklist | Both | **Open – pending device QA** |
| PV-2 | Non-participant identity leak (Phase 7 Case 2): after confirmation, non-participants (Account C) may see revealed identities that should remain anonymized. Never tested on device. | Phase 7 checklist | Both | **Open – pending device QA** |
| PV-3 | Chat RLS (Phase 8 Case 4): non-member (Account C) read/send access to a conversation has never been verified on device; unauthorized access may succeed. | Phase 8 checklist | Both | **Open – pending device QA** |
| PV-4 | Preference RLS (Phase 6 Case 5): non-participant preference write and cross-user preference update have never been verified on device. | Phase 6 checklist | Both | **Open – pending device QA** |
| PV-5 | Review RLS (Phase 7 Case 6): non-participant review insert and cross-user review edit have never been verified on device. | Phase 7 checklist | Both | **Open – pending device QA** |
| PV-6 | ~~Debug ingest code in `locationService.ts`~~ — `agentLog`, `DEBUG_HOST`, `DEBUG_INGEST_URL`, and debug ingest sent location telemetry to an external endpoint. | TASKS.md / ANDROID-LOCATION-ISSUE-CONTEXT.md §8 | Both | **Fixed 2026-03-15** — removed from locationService.ts. |

---

## 3. Crashes

| # | Summary | Source | Platform | Status |
|---|---------|--------|----------|--------|
| CR-1 | ~~Android location crash~~ — `getCurrentPosition` with react-native-geolocation-service caused app stop/crash after 15s timeout on Android. | ANDROID-LOCATION-ISSUE-CONTEXT.md | Android | **Fixed 2026-03** — migrated to expo-location; Expo modules configured in `android/settings.gradle`; `getCurrentPositionAsync` + `getLastKnownPositionAsync` fallback. |
| CR-2 | ~~Map tab max update depth (iOS)~~ — Caused excessive re-renders and potential UI unresponsiveness on the Map tab. | auth-profile-validation-checklist.md 2026-02-27 notes | iOS | **Fixed 2026-02-27** — stable `initialRegion` + `key` prop applied. |
| CR-3 | ~~Firebase not loaded on Android cold start~~ — Firebase initialization on startup caused crash on Android. | auth-profile-validation-checklist.md 2026-02-27 notes | Android | **Fixed 2026-02-27** — Firebase is now lazy-loaded. |
| CR-4 | Push notification cold-start and background-open handlers (Phase 4 Case 5) never tested — notification open payload could break navigation flow on cold start. | Phase 4 checklist | Both | **Open – pending device QA** |

---

## 4. UX polish

| # | Summary | Source | Platform | Status |
|---|---------|--------|----------|--------|
| UX-1 | Debug instrumentation UI (`DevLocationLogPanel`) and `agentLog` logs visible in dev build; must be gated or removed before release. | ANDROID-LOCATION-ISSUE-CONTEXT.md §8 / CLAUDE.md | Both | **Open – pre-release cleanup** |
| UX-2 | Phone OTP auth flow (auth Case 5) never validated on either platform. OTP path may surface errors or broken session state. | auth-profile-validation-checklist.md | Both | **Open – not tested** |
| UX-3 | Phase 4 notifications: permission-denied graceful fallback, invalid token non-blocking behavior, and duplicate-token prevention not tested on device. | Phase 4 checklist | Both | **Open – pending device QA** |
| UX-4 | Geofence detection (Phase 3 Case 2), create/discover flow (Case 3), join request (Case 4), friend request (Case 5), and quick match (Case 6) all untested — loading states and error UX in these flows unverified. | VALIDATION_PLAN.md / TASKS.md | Both | **Open – pending device QA** |
| UX-5 | Leave conversation UI does not exist (Phase 8 Case 6 explicitly deferred); membership deactivation only testable via SQL. | Phase 8 checklist | Both | **Open – backlog (no UI)** |
| UX-6 | Chat moderation/report flow not implemented (V2.1-4 backlog). | v2-v4-implementation-backlog.md | Both | **Open – not implemented** |
| UX-7 | Abuse controls for post-match reviews not implemented (V2.1-2 backlog). | v2-v4-implementation-backlog.md | Both | **Open – not implemented** |
| UX-8 | `npm run lint` has pre-existing `no-undef` errors in `jest.setup.js`; app feature files pass but lint gate is not clean. | release-readiness-checklist.md | N/A | **Open – known, owner needed** |

---

## Release blockers summary

Items that are **Open** and must be resolved before release per the Go/No-Go gate:

| ID | Bucket | Blocker |
|----|--------|---------|
| DC-7 | Data correctness | Phase 3 results file created; Cases 2–6 device QA not run |
| DC-1 | Data correctness | Phase 6 device QA (flexible finalization) not run |
| DC-5, DC-6 | Data correctness | Phase 7 review constraints not validated on device |
| PV-1, PV-2 | Privacy | Anonymous-until-confirmed identity not validated on device |
| PV-3 | Privacy | Chat RLS not validated on device |
| ~~PV-6~~ | Privacy | ~~Location debug ingest~~ (fixed 2026-03-15) |
| CR-4 | Crashes | Push cold-start handler not tested |
| All Phase 4 | Crashes/UX | Notification flow (Cases 1–5) not run on any platform |

---

## Triage log

| Date | Action |
|------|--------|
| 2026-02-27 | Triage results doc created; run triage after steps 1–6 and populate from phase/checklist docs. |
| 2026-03-14 | Full triage run: scanned auth-profile results, phase-6-8-validation-results, all phase checklists (4, 6, 7, 8), v2-v4 backlog, TASKS.md, ANDROID-LOCATION-ISSUE-CONTEXT.md, release-readiness-checklist.md. Populated all four buckets. No confirmed data/privacy defects from completed runs; auth Cases 1–4/6 passed; three crash items fixed. All Phase 3/4/6/7/8 device validations remain open (not run). |
| 2026-03-15 | PV-6 fixed: removed agentLog, DEBUG_HOST, DEBUG_INGEST_URL, and sendDebugLog usage from locationService.ts (no location telemetry to external endpoint). |
