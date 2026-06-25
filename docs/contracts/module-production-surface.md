# Module — Production App Store surface (no beta-testing UI)

**Contract id:** `module-production-surface`  
**Status:** Draft — App Store Build 11 rejected (Guideline 2.2 repeat)  
**Screens:** Welcome, Login, Signup, Profile, Play empty, Onboarding, Feedback  
**Related code:** `src/constants/betaCopy.ts`, `src/constants/productCopy.ts`, `BetaMarketBanner`, `BetaFeedbackScreen`, `OnboardingModal`, `WelcomeScreen`, `AuthScreenLayout`, `DiscoverEmptyState`

## Purpose

The **App Store production binary** must not present itself as a beta-testing product. TestFlight is for tester recruitment; the store build reads as a normal 1.0 app for LA pickup sports.

North-star: **No reviewer-visible “beta tester” funnel** — no Beta badges, founding-member recruitment, manual concierge, captain apply flows, or in-app beta feedback branding. Apple 2.2 (Build 11, Jun 24) still failed after literal “beta” removal — treat **limited-rollout + manual-ops** UI as in-scope.

## Demo setup

1. EAS **production** profile build (or local release config mirroring production).
2. Account: `marcus@rally-mvrhoops.demo` / fresh signup.
3. Walk: Welcome → Login → Profile (Me + Settings) → Play empty state.

## Required states

| Surface | Must NOT show (production) | May show (neutral) |
|---------|--------------------------|-------------------|
| Welcome / auth | “Rally **Beta**”, “test Rally”, “Founding Member” | LA availability, sport chips |
| Profile → Me | “**LA BETA**” badge card; **Sport captain program** apply; **Concierge** manual match | Player card, sport prefs |
| Profile → Settings | Section titled “**Beta**”; “Beta feedback” | “Help” / “Send feedback” |
| Feedback screen | Title “**Beta** feedback”; founder perks pitch | “Send feedback”, support copy |
| Onboarding modal | Beta headline; founder benefits | Sport/skill picker only |
| Play empty state | “Rally **Beta** is focused on…” footer | LA availability line without “beta” |
| `__DEV__` only | Validator / pipeline panels | N/A — not in store binary |

## Pass/fail checklist

### Guideline 2.2 — Beta testing UI

- [ ] **Welcome** last slide: no string containing “beta” (case-insensitive)
- [ ] **Login / Signup** header: no “beta” in visible copy
- [ ] **Profile → Me**: no `BetaMarketBanner` or equivalent LA BETA card
- [ ] **Profile → Settings**: no group label “Beta”; feedback row titled “Send feedback” or “Help & feedback”
- [ ] **Feedback screen** title ≠ “Beta feedback”; no Founding Member recruitment body
- [ ] **Onboarding modal** (first session): no beta headline or founder benefits block
- [ ] **Play → Games empty**: footer does not contain “beta”
- [ ] **Global search** (release bundle): no user-facing `accessibilityLabel` / visible text “Beta feedback”
- [ ] **Profile → Me**: no Sport captain “Apply” / concierge “match you manually” blocks (Build 11)
- [ ] **Auth sport chips**: not a 2-sport wedge only (include full launch set)
- [ ] **ASC App Review notes**: no “beta”, “TestFlight”, or “closed beta” in reviewer paste
- [ ] **Demo seed**: Play Discover + Inbox populated for `marcus@…` (Build 14 — `seed_store_review_demo.sql`)
- [ ] **Profile display name**: not raw `.demo` email

### Stability

- [ ] Removing beta UI does not remove legitimate **Contact support** / feedback path
- [ ] No redbox on Profile, Play, Welcome after copy change

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Profile load | No regression vs baseline |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — copy and navigation only.

## External dependencies

| ID | Service | Required for |
|----|---------|--------------|
| E1 | EAS production build | Tier 2 device proof for App Review recording |

## Human decision gates

| ID | Decision | Options | Default |
|----|----------|---------|---------|
| H1 | LA geography callout | A) Remove entirely · B) Neutral “Available in Los Angeles” | **A** (Build 12 — product copy, no geo wedge on welcome) |

## Screenshots required

`docs/contracts/screenshots/module-production-surface/`:

| File | Capture |
|------|---------|
| `01-welcome-no-beta.png` | Welcome — no beta copy |
| `02-profile-settings-help.png` | Settings — Help/feedback, no Beta section |
| `03-play-empty-no-beta.png` | Play empty — no beta footer |
| `04-feedback-screen-neutral.png` | Feedback title neutral |

## Out of scope

- TestFlight tester recruitment (App Store Connect only)
- Removing `BETA_REGION` geofence logic (backend/constants OK if not user-visible)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Apple 2.2 Build 9 — beta UI in production | Builder |
| 2026-06-24 | Apple 2.2 Build 11 — captain/concierge + LA wedge + ASC notes | Builder |

## Validator report

> Run: 2026-06-24 · after Apple **Build 11** rejection (Guideline 2.2 repeat)

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1–7 | Literal “beta” strings (Welcome, auth, settings, feedback, onboarding, play empty) | ✅ Pass | Build 10 (#63) — spot-check on `dev` |
| 8 | No “Beta feedback” in Settings | ✅ Pass | “Send feedback” under Help |
| 9 | Profile → Me — no beta banner | ✅ Pass | `BetaMarketBanner` not mounted |
| 10 | Profile → Me — **no beta-ops recruitment** | ❌ Fail | Captain program + concierge visible to all users |
| 11 | Auth — not 2-sport wedge | ❌ Fail | `AuthScreenLayout` chips: Badminton + Pickleball only |
| 12 | Onboarding — full sport set | ❌ Fail | `BETA_SPORTS` = 2 sports |
| 13 | ASC review notes | ❌ Fail | Doc still has “closed LA sports beta” paste — must update in Connect |
| 14 | Admin (if reachable) | ⚠️ | “Beta feedback” section title remains |
| 15 | No redbox | ✅ Pass | Play / You / Inbox load |

**Build 12 blockers:** rows 10–13 resolved on `dev` (BETA_OPS off, 3-sport auth wedge). **Tier 4 regression (2026-06-24):** spot-check pass on `fix/cross-surface-tier4-builder` — no redbox on Play/You/Inbox.

Screenshots: `docs/contracts/screenshots/module-production-surface/`
