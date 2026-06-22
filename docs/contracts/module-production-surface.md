# Module — Production App Store surface (no beta-testing UI)

**Contract id:** `module-production-surface`  
**Status:** Draft — App Store Build 10 (Guideline 2.2)  
**Screens:** Welcome, Login, Signup, Profile, Play empty, Onboarding, Feedback  
**Related code:** `src/constants/betaCopy.ts`, `src/constants/productCopy.ts`, `BetaMarketBanner`, `BetaFeedbackScreen`, `OnboardingModal`, `WelcomeScreen`, `AuthScreenLayout`, `DiscoverEmptyState`

## Purpose

The **App Store production binary** must not present itself as a beta-testing product. TestFlight is for tester recruitment; the store build reads as a normal 1.0 app for LA pickup sports.

North-star: **No reviewer-visible “beta tester” funnel** — no Beta badges, founding-member recruitment, or in-app beta feedback branding.

## Demo setup

1. EAS **production** profile build (or local release config mirroring production).
2. Account: `marcus@rally-mvrhoops.demo` / fresh signup.
3. Walk: Welcome → Login → Profile (Me + Settings) → Play empty state.

## Required states

| Surface | Must NOT show (production) | May show (neutral) |
|---------|--------------------------|-------------------|
| Welcome / auth | “Rally **Beta**”, “test Rally”, “Founding Member” | LA availability, sport chips |
| Profile → Me | “**LA BETA**” badge card | Player card, sport prefs |
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
| H1 | LA geography callout | A) Remove entirely · B) Neutral “Available in Los Angeles” | **B** |

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

## Validator report

> Run: 2026-06-22 · queue `app-store-build-10` · sim iPhone 16

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Welcome — no “beta” | ✅ | Welcome carousel + LA headline; screenshot `01-welcome-no-beta.png` |
| 2 | Login/Signup header — no beta | ✅ | `AuthScreenLayout` + `MARKET_COPY.headline` |
| 3 | Profile → Me — no BetaMarketBanner | ✅ | Banner removed; sim Me tab clean |
| 4 | Profile → Settings — Help not Beta | ✅ | “Help” + “Send feedback”; screenshot `02-profile-settings-help.png` |
| 5 | Feedback title neutral | ✅ | Nav title “Send feedback”; founder box removed |
| 6 | Onboarding — no beta/founder | ✅ | `OnboardingModal` neutral headline |
| 7 | Play empty — no beta footer | ✅ | `discoverEmptyTrySport` + `playEmptyRegion` neutral |
| 8 | No “Beta feedback” a11y label | ✅ | `AppNavigator` title updated |
| 9 | Feedback path still works | ⏳ | Tap “Send feedback” — defer to Build 10 device recording |
| 10 | No redbox regression | ✅ | Today / You / Play load on sim |

Screenshots: `docs/contracts/screenshots/module-production-surface/`
