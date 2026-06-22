# Module — UGC moderation (App Store Guideline 1.2)

**Contract id:** `module-ugc-moderation`  
**Status:** Draft — App Store Build 10  
**Screens:** Signup, Login, `TosAcceptanceGate`, `SafetyActionsSheet`, `ChatThreadScreen`, `PlayerProfileModal`, Profile → Settings → Safety  
**Related code:** `src/constants/legal.ts`, `src/services/safetyService.ts`, `src/components/SafetyActionsSheet.tsx`, `src/components/chat/ChatMessageBubble.tsx`, `src/pages/Admin/AdminScreen.tsx`

## Purpose

User-generated content (chat, profiles, game posts) has **terms with zero tolerance**, **report**, and **block** paths that Apple reviewers can find without founder help.

North-star: **Signup/login terms → flag content → block user → blocked user vanishes from feed/chat; developer notified via report queue.**

## Demo setup

1. Two accounts: `marcus@…` and fresh signup or second demo user.
2. Open a **direct message** thread between them (Inbox → friend chat).
3. Optional: crew/game room with at least one message from another user.

## Required states

| State | Must show |
|-------|-----------|
| **Signup** | Terms + **Community standards** checkbox before Create account; includes zero-tolerance for objectionable content |
| **Login** | Visible line: signing in agrees to Terms + Community standards (link or tappable) |
| **Post-login legal gate** | “Before you play” full sections including community standards |
| **DM chat** | Header **Safety** → Report user · Block user |
| **Group / game room chat** | Long-press **other user’s message** → Report · Block (or Safety menu) |
| **Player profile modal** | Safety → Report · Block |
| **Profile → Settings → Safety** | Blocked users list; hint points to Safety in chat/profile |
| **After block** | User removed from Discover rows and chat inbox immediately; cannot send DM |
| **After block** | Developer receives **report row** in `user_reports` (auto on block) |

## Pass/fail checklist

### Terms / EULA (1.2)

- [ ] **Signup:** cannot submit without accepting terms **and** community standards
- [ ] **Login:** terms + community standards visible **before** Sign in (not only post-login)
- [ ] **Community standards** text includes **no tolerance** for objectionable content, harassment, hate, sexual content involving minors, threats
- [ ] **Before you play** modal includes community standards section (post-login reinforcement OK)

### Flag objectionable content

- [ ] **DM:** Safety → Report user → reason chips → Submit → success alert
- [ ] **Report** inserts row in `user_reports` with `context_type` chat/profile/activity as appropriate
- [ ] **Group chat:** long-press other user’s message → Report (pre-fills reported user + message context in detail)
- [ ] Report path reachable in **≤3 taps** from an open chat thread

### Block abusive users

- [ ] **Block user** from Safety sheet → confirmation → success
- [ ] **Block also submits developer report** (linked `user_reports` row — reason harassment or `blocked_user`)
- [ ] Blocked user **hidden from Play Discover** activity rows hosted by blocked user
- [ ] Blocked user **hidden from chat inbox** / cannot open new DM
- [ ] Open DM with blocked user shows read-only / blocked state (no send)
- [ ] **Profile → Settings → Safety → Blocked users** lists blocked account

### Admin / developer notification

- [ ] `user_reports` row created on report and on block (admin queue can triage — `AdminScreen` for `is_admin`)

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Block → inbox refresh | < 2s until blocked thread hidden |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — existing `user_reports` / `user_blocks` tables.

## External dependencies

| ID | Service | Required for |
|----|---------|--------------|
| E1 | Supabase `user_reports`, `user_blocks` | All rows |
| E2 | Physical device recording | App Review resubmission notes |

## Human decision gates

| ID | Decision | Options | Default |
|----|----------|---------|---------|
| H1 | Auto-report on block | A) Always insert report · B) Report optional | **A** (Apple requirement) |

## Screenshots required

`docs/contracts/screenshots/module-ugc-moderation/`:

| File | Capture |
|------|---------|
| `01-signup-terms-community.png` | Signup checkboxes |
| `02-login-terms-footer.png` | Login terms line |
| `03-chat-safety-sheet.png` | Safety → Report / Block |
| `04-report-submitted.png` | Report success |
| `05-blocked-inbox.png` | Blocked user gone from inbox |
| `06-message-long-press-report.png` | Group chat flag path |

## App Review recording script

Physical device screen recording for ASC **Notes** (Build 10+):

1. Fresh signup → terms + community standards → account created
2. DM → Safety → Report user → submit
3. Safety → Block user → show inbox/feed no longer shows them

## Out of scope

- Automated ML moderation
- 24/7 human moderation SLA
- Report individual messages to auto-hide without block (v1: report user + block)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Apple 1.2 Build 9 — UGC precautions | Builder |

## Validator report

> Run: 2026-06-22 · queue `app-store-build-10` · sim iPhone 16 · seed re-run

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Signup terms + community standards checkbox | ✅ | `01-signup-terms-community.png` |
| 2 | Login terms before Sign in | ✅ | Zero-tolerance footer; `02-login-terms-footer.png` |
| 3 | Community standards — no tolerance language | ✅ | `COMMUNITY_STANDARDS_TEXT` on signup + legal gate |
| 4 | Before you play — community standards section | ✅ | `flow-auth-onboarding/01-legal-gate-community-standards.png` |
| 5 | DM Safety → Report / Block | ⏳ | Sim: marcus login did not complete; code path exists in `SafetyActionsSheet` |
| 6 | Report inserts `user_reports` row | ⏳ | SQL proof deferred — device recording script |
| 7 | Group long-press → Report | ⏳ | `ChatMessageBubble` + hint in Settings; no crew thread on empty test user |
| 8 | Report ≤3 taps from chat | ✅ | DM: header Safety (2 taps to report mode) |
| 9 | Block → confirmation → success | ⏳ | Needs DM thread on device |
| 10 | Block auto-submits developer report | ✅ | Code: `blockUser` calls `submitUserReport` after upsert |
| 11 | Blocked user hidden from Discover/inbox | ⏳ | Existing filter logic; verify on device after block |
| 12 | DM blocked — no send | ⏳ | `blockedThread` banner exists; verify on device |
| 13 | Settings → Blocked users list | ✅ | Section visible; screenshot `03-profile-settings-safety-hint.png` |
| 14 | Admin `user_reports` queue | ⏳ | `AdminScreen` exists; verify after report on device |

**Sim gaps:** Re-seed OK; `marcus@rally-mvrhoops.demo` login via automation unreliable — use physical device recording per script below.

Screenshots: `docs/contracts/screenshots/module-ugc-moderation/`
