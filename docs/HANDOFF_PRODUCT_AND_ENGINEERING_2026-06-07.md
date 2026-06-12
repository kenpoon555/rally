# Handoff — product review + engineering changes (2026-06-03 → 2026-06-07)

**Date:** 2026-06-07  
**Audience:** Advisor / review agent (with or without repo access)  
**Purpose:** Single handoff covering what shipped, what broke, what was fixed, operational store/deploy state, product concerns, and recommended next work.

**Companion docs (canonical):**
- [vision.md](./vision.md) — strategy & north star
- [market_call_02_ADVISOR_HANDOFF.md](./market_call_02_ADVISOR_HANDOFF.md) — S1–S11 engineering snapshot
- [../../open_items.md](../../open_items.md) — business stages & monetization gates
- [design-review/DESIGN_REVIEW_v2.md](./design-review/DESIGN_REVIEW_v2.md) — Today / Play / logo direction

---

## Executive summary

Rally is a **closed LA beta** (badminton, pickleball, basketball) for **crew-first sports coordination**: persistent Rallies, Join → I'm in → Lock roster, game rooms, trust/reliability, Discover liquidity boards.

**Last 4 days were heavy on shipping and ops**, not strategy pivots:

| Area | Status |
|------|--------|
| Production deploy pipeline | Working after build-number fix; iOS/Android **v5** submitted |
| Store visibility | Play **Internal testing** (`app.rally.sports`); TestFlight build 5 after export-compliance fix |
| Product UX | Rally hub (Chat/Play/Members), Play v5, keyboard-safe inputs, icons rebuilt |
| Strategic risk | **Feature surface >> retention proof** — north star `analytics_crew_lifecycle.retained` not yet validated at scale |

**Product grade (external review): B−** — right architecture and ICP, but scope has outrun the retention hypothesis.

---

## 1. Engineering & product changes (last 4 days)

Commits on `dev` / merged PRs **2026-06-03 through 2026-06-07** (see `git log --since=2026-06-03` in `RallyApp/`).

### 1.1 Deploy, CI, and store ops

| Change | Detail |
|--------|--------|
| **PR #18** — build numbers | Bumped `versionCode` / `buildNumber` past duplicate **v3** that blocked EAS auto-submit |
| **Production deploy #27087856080** | Succeeded — iOS build **5**, Android version code **5**, auto-submitted |
| **PR #19 / commit `ceff88a`** | `ITSAppUsesNonExemptEncryption: false` in `Info.plist` + `app.json`; TestFlight was hidden with `MISSING_EXPORT_COMPLIANCE` until set manually on build 5 |
| **Icons rebuild** | `scripts/build-app-icon-assets.py`, `generate-app-icons.sh`; Android adaptive icons (`ic_launcher.xml`, `colors.xml`, foreground mipmaps); docs in [github-actions-production.md](./github-actions-production.md#troubleshooting) |
| **PR #20** — iOS push entitlements | Preview/production EAS fixes: omit push entitlements when AdHoc/App Store profile is stale (`815fef9`, `e1efe56`) |
| **Android FCM manifest** | Default notification channel merge conflict fixed (`75062e9`) |
| **Build numbers synced to 5** | Local `app.json` / native files aligned with latest EAS production (`9d1af63`) |
| **Package IDs** | Android: `app.rally.sports` · iOS: `com.rallyapp` (not `com.rallyapp` on Play) |

**Where to check builds:**
- EAS: expo.dev → project `rallyapp`
- Play: **Internal testing** track on package `app.rally.sports` (Production release history may look empty)
- TestFlight: build 5+ after export compliance baked into native plist

### 1.2 Rally hub UX & Play v5 (`13eafe5`, large)

Major product commit — **82 files**, migrations **058–062**:

| Feature | Notes |
|---------|--------|
| **Rally hub** | `RegularsCrewScreen` → Chat / Play / Members tabs; inbox Rallies route here |
| **Create Rally game** | `CreateRallyGameSheet.tsx` — schedule games inside a Rally |
| **Roster seat bar** | `RosterSeatBar.tsx` — visual capacity on cards |
| **Play tab polish** | Sport filter icons aligned with Discover; `GameModeChip`, `playTabActions` |
| **Members panel** | `RallyCrewPanel` fold — crew list in hub |
| **Create Game refactor** | Large `CreateActivityScreen.tsx` rewrite |
| **Google Places limiter** | `googlePlacesLimiter.ts` — rate/cost guard on Places API |
| **Add court sheet** | Expanded court search UX |
| **DB migrations** | Roster min/max, member-schedule games, silent game-ready push, roster helper fixes |
| **Demo seeds** | Monrovia basketball, El Monte, Jade designer demo SQL + `seed-monrovia-basketball-rally-demo.mjs` |

### 1.3 Push notifications & game room (`955accf`, 2026-06-06)

- Firebase messaging wiring, game room chat UX improvements
- Agent workflow docs under `.cursor/workflows/`
- `send-push` edge function updates

### 1.4 Today / Play v4 (`8dd4a88`, `c8d9c8d`)

- Today schedule UI, unified game cards
- Game room + activity detail polish for preview

### 1.5 Android keyboard / input visibility (session work, in `13eafe5` + follow-ups)

**Problem:** On Android, software keyboard covered text fields. App-wide pattern was `KeyboardAvoidingView` with `behavior` only on iOS.

**Solution — new shared utilities** (`src/components/ui/KeyboardSafeView.tsx`):

| Export | Purpose |
|--------|---------|
| `KeyboardSafeView` | `behavior="padding"` on **iOS and Android** |
| `keyboardAwareScrollProps` | `automaticallyAdjustKeyboardInsets`, tap handling, dismiss on drag |
| `KeyboardSafeBottomSheet` | Bottom modals shift above keyboard |
| `useKeyboardInset` / `useComposerBottomPadding` | Android chat composer padding |
| `useKeyboardVisible` | Keyboard open state |

**Wired into:** Auth, Create Game, Profile, Activity Detail, Admin, Mini Tournament, Friends, Beta Feedback, Regulars Crew, Chat threads, Rally chat panel, Add Court, Safety Actions, Create Poll, Invite Friends sheets.

**Config:** `app.json` → `android.softwareKeyboardLayoutMode: "resize"` (manifest already had `adjustResize`).

**Bug found in QA:** `RegularsCrewScreen` used `KeyboardSafeView` without import → red screen **"Property 'KeyboardSafeView' doesn't exist"**. **Fixed** — import added from `../../components/ui` (in HEAD as of 2026-06-07).

### 1.6 Local dev / simulator notes (2026-06-07 session)

| Item | Detail |
|------|--------|
| Metro | Already on port **8081** |
| iOS | `npm run ios` → iPhone 17 Pro simulator, launch OK |
| Android | First `npm run android` failed at Gradle `packageDebug`; clean build + `npm run android:build-install` succeeded |
| Auth noise | Stale AsyncStorage refresh token → `AuthApiError: Invalid Refresh Token` in dev (non-fatal; clear storage or re-login) |

### 1.7 Sound / haptics (decision only — no code)

- **No in-app UI sounds** — no `expo-av`, no haptics
- Only audio: **system push notification** sound (Firebase)
- **Recommendation:** stay silent for beta (Instagram/Threads model); optional light haptics later on send/join

### 1.8 Google Places / courts (analysis only)

- **Court picker:** DB-only via PostGIS `get_nearby_locations`
- **Places API:** opt-in host flow only — "Add a court" in `AddCourtSheet` → `courtService.addCourtFromPlacesSearch`
- **Discover:** Supabase + client distance; no auto-Google on empty DB
- See [court-data-strategy.md](./court-data-strategy.md)

### 1.9 Uncommitted local changes (as of handoff)

```
M .github/workflows/ci.yml
M .github/workflows/deploy-preview.yml
M docs/github-actions-preview.md
```

Not merged — preview CI workflow tweaks only.

---

## 2. Product review — concerns & recommendations

*Synthesized from [vision.md](./vision.md), [open_items.md](../../open_items.md), codebase audit, and Claude CLI strategy pass (2026-06-07).*

### 2.1 Executive verdict

- **Strength:** Crew-first architecture + commitment flow is genuinely differentiated vs WhatsApp.
- **Risk:** S1–S11 built platform-scale surface **before** crew replay % is proven.
- **Grade: B−** — right instincts; execution discipline needs a scope freeze.

**North star (unchanged):** `% of Regulars groups with ≥1 replay within 14 days` — `analytics_crew_lifecycle.retained`.

**Strategic gate (unchanged):** No Teams, Leagues, or payments until retention validates.

### 2.2 Twelve-angle summary

| # | Angle | Concern / note |
|---|--------|----------------|
| 1 | **PMF** | Problem real; switching requires captain to adopt — proof of replay still needed |
| 2 | **ICP** | True wedge = **recurring crew captain** (25–42, LA, 2–4×/week); vision lists "can't find players" first — creates liquidity vs retention tension |
| 3 | **vs WhatsApp** | Moat = reliability + roster lock, not chat; hook: *"Everyone confirms. We track who shows up."* |
| 4 | **Retention** | Captain churn = crew death; missing dormancy re-engagement + numeric target (e.g. 50% of 2-game crews play game 3 within 14 days) |
| 5 | **Discovery** | Heavy infra (need players, free agents, captains) before retention proof; LA density is hard |
| 6 | **Trust** | Reliability + block/report strong; first-game trust bootstrapping weak |
| 7 | **UX / onboarding** | Captain path ~7 steps before value; Today empty state for users with no crew is critical |
| 8 | **Scope** | Too many features for closed beta — maintenance + UX noise |
| 9 | **Competition** | Not sports Tinder; coordination OS for recurring recreational crews |
| 10 | **Monetization** | Correctly deferred; Organizer Pro first when WTP exists |
| 11 | **GTM (LA)** | Captain-first acquisition beats individual player ads |
| 12 | **Ops / tech** | Court DB sparseness hurts discovery; funnel instrumentation likely incomplete |

### 2.3 Top 10 improvements (ranked)

| Rank | Improvement | Effort |
|------|-------------|--------|
| 1 | Captain re-engagement when crew dormant 10–14 days | S |
| 2 | Instrument captain funnel: signup → crew → invite → 5+ confirmed | S |
| 3 | Today tab empty state: Create Rally / Find a game | S |
| 4 | Manual LA court DB seed (Parks & Rec, clubs, USAPA) | S |
| 5 | Copy centered on reliability hook | S |
| 6 | White-glove onboard 8–12 LA captains | M |
| 7 | UX polish (keyboard, icons, export compliance) | M — **partially done** |
| 8 | Post-game captain summary + one-tap ghost flag | M |
| 9 | Progressive disclosure — hide advanced boards until first crew game | M |
| 10 | Publish retention target number with team | S |

### 2.4 Target audience (for next reviewer)

**Primary:** Recurring crew captain — LA metro, badminton/pickleball, runs WhatsApp today, hurt by no-shows.

**Secondary:** Regular crew member (fast confirm only); discovery player (needs liquidity first).

**Anti-personas (now):** Monthly casual player; competitive club (CourtReserve); WhatsApp-loyalist captain; non-LA; large team sports.

### 2.5 90-day focus (recommended)

**Build:** dormancy push, funnel events, Today empty states, court seeding, captain onboarding playbook.

**Measure:** crew replay %, captain D14 retention, invite→install→confirm funnel, no-show rate per crew.

**Stop:** new discovery surface, new engagement features (tournaments/leaderboard expansions), individual-player acquisition, features without metric tied to replay %.

### 2.6 Hard truth

> The product surface already exceeds what's needed to validate the hypothesis. Validate with three things: **roster lock, post-game attendance, captain re-engagement.** Get ~200 crews proving the weekly loop before scaling scope.

---

## 3. Known issues & QA gaps

| Issue | Severity | Status |
|-------|----------|--------|
| Android keyboard covering inputs | P1 UX | **Mitigated** — `KeyboardSafeView` rollout; verify on device |
| `RegularsCrewScreen` missing import | P0 crash | **Fixed** in HEAD |
| TestFlight export compliance | P1 ops | **Fixed** in native plist (`ceff88a`); needs **new production build** for store icons + compliance together |
| Wrong store icons on v5 in stores | P2 brand | Icons rebuilt locally; **await next production EAS build** after merge |
| Stale refresh token LogBox noise | P3 dev | Clear AsyncStorage or ignore in dev |
| Android `packageDebug` intermittent failure | P2 dev | Clean build + `android:build-install` workaround |
| Court DB sparse in some neighborhoods | P2 product | Manual seeding recommended |
| Captain onboarding funnel not instrumented | P1 metrics | **Not built** |
| Feature overload for new users | P2 UX | Progressive disclosure not built |

**QA checklist:** [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md) — run two-device pass on preview after next merge.

---

## 4. Key paths for reviewing agent

| Area | Path |
|------|------|
| Keyboard utilities | `src/components/ui/KeyboardSafeView.tsx` |
| Rally hub | `src/pages/Regulars/RegularsCrewScreen.tsx`, `src/components/rally/*` |
| Product copy | `src/constants/productCopy.ts` |
| Create game | `src/pages/Activity/CreateActivityScreen.tsx` |
| Courts / Places | `src/services/courtService.ts`, `src/services/api/googlePlaces.ts` |
| Deploy | `eas.json`, `.github/workflows/deploy-production.yml` |
| Icons | `scripts/build-app-icon-assets.py`, `assets/branding/` |
| Migrations (recent) | `supabase/migrations/058_*.sql` … `062_*.sql` |
| Analytics views | migration `026` — `analytics_crew_lifecycle`, `analytics_crew_funnel_30d` |

---

## 5. Questions for the next agent

1. What is **current** `analytics_crew_lifecycle.retained` on preview/prod Supabase? Is there a target %?
2. Has anyone run **two-device QA** on the Rally hub + Create Rally game flow since `13eafe5`?
3. Should **PR #19 / icon + export compliance** changes be on `production` branch yet? Store v5 may still show old icons.
4. Is the team willing to **hide** Free Agent / Need Players / tournament surfaces for users with 0 crew games?
5. Which **5–10 LA captains** are being white-glove onboarded this week? ([FOUNDER_WEEK2_CHECKLIST.md](./FOUNDER_WEEK2_CHECKLIST.md))

---

## 6. Suggested immediate next steps (engineering)

1. Merge preview CI workflow tweaks if ready; promote **dev → preview → main → production** for icon + compliance build.
2. On Android device: regression pass on keyboard — Create Game court search, Profile fields, Rally chat composer, Add Court sheet.
3. Query replay metric; if below target, **do not** scope new discovery features.
4. Implement **captain dormancy notification** + **funnel events** (highest ROI, small effort).
5. Seed additional LA courts via `scripts/seed-la-courts.mjs` + manual Parks & Rec list.

---

## 7. Changelog reference (commits)

```
31bf8eb  Merge dev: Android preview manifest conflict
ceff88a  iOS export compliance + icon rebuild
13eafe5  Rally hub UX, Play v5, keyboard, migrations 058-062
955accf  Push notifications, game room chat UX
67d2a82  Bump build numbers (PR #18)
8dd4a88  Play v4 + Today schedule UI
24075d6  Android package app.rally.sports
```

---

*End of handoff. Update this file when retention numbers or production build state change.*
