# App Store rejections — Jun 2026

---

## Build 11 — Jun 24, 2026 (Guideline 2.2 — still beta-testing UI)

**Submission ID:** `c5b8e615-5701-4cd5-a951-2d41b64805c1`  
**Review device:** iPad Air 11-inch (M3)  
**Version:** 1.0 (11)

### What Apple said

> Your app **still** includes features that are intended to support beta testing. Since you are submitting a production version of your app, features intended to support beta testing are not appropriate.

This is a **repeat** of Guideline 2.2 after Build 10 work (PR #63, `0681d97`) removed literal “Beta” labels from Welcome, Profile → Settings, and Feedback. Apple is not only matching the word `beta` — they treat **limited-rollout / manual-ops / tester-recruitment** surfaces as beta-testing support.

### What they are likely referring to (reviewer path)

Walkthrough with `marcus@rally-mvrhoops.demo` on iPad (iPhone layout):

| Priority | Surface | What reviewer sees | Why Apple may flag it |
|----------|---------|-------------------|------------------------|
| **P0** | **App Review notes** (ASC) | Paste still says *“Rally LA — **closed LA sports beta**”* (see below) | Tells reviewer to evaluate as a beta, not 1.0 |
| **P0** | **Profile → Me** | **Sport captain program** — “Apply to be a captain”, “direct line to us” | Tester / ambassador recruitment |
| **P0** | **Profile → Me** | **Need help finding a game?** — “we will **match you manually** in Los Angeles” | Manual concierge = beta ops, not finished product |
| **P1** | **Login / Signup** (`AuthScreenLayout`) | LA-only headline + only **Badminton / Pickleball** chips | Reads as closed cohort, not full launch |
| **P1** | **Welcome** last slide | `MARKET_COPY.headline` — LA + 3 sports only | Geographic / sport wedge = limited beta |
| **P1** | **Onboarding modal** (new signup) | Same headline; sport picker = **2 sports only** (`BETA_SPORTS`) | Beta wedge onboarding |
| **P1** | **Play empty** | `playEmptyRegion` — “focused on LA …” footer | Closed-market messaging |
| **P2** | **Admin** (if `is_admin`) | “Beta feedback”, “Metrics for **beta health**” | Literal beta admin tooling |
| **P2** | **Edge / share defaults** | `appLinks.ts` TestFlight URL fallback | TestFlight install links in production flows |

**Already fixed in Build 10 (#63):** Welcome/Profile no longer say “Rally Beta”; Settings → “Send feedback”; feedback screen title neutral; `BetaMarketBanner` not mounted on Profile Me.

### Fix plan (Build 12)

**A. App Store Connect (no binary — do before resubmit)**

- [ ] **App Store → version 1.0 → App Review Information → Notes** — see [store-review-test-accounts.md](./store-review-test-accounts.md) for ASC navigation + production paste
- [ ] **App description / subtitle** (if they mention beta): align with 1.0 product language.

**B. Code (production binary)**

| Item | Action |
|------|--------|
| Captain program block | Hide in production **or** reframe as “Partner with Rally” without apply / direct-line recruitment |
| Concierge block | Remove from Profile Me **or** replace with self-serve copy (no “match you manually”) |
| `MARKET_COPY` / auth chips | Short neutral tagline; show full sport set on auth (include Basketball) |
| `OnboardingModal` | All launch sports, not `BETA_SPORTS` (2 only) |
| `playEmptyRegion` | Remove or soften to “More sports coming soon” without “focused on LA” wedge |
| `AdminScreen` | Rename “Beta feedback” → “User feedback”; drop “beta health” subtitle |
| `IOS_INSTALL_URL` | EAS secret → App Store URL, not TestFlight default |

**C. Resubmit**

- [x] Code on `fix/app-store-build-12` — captain/concierge hidden, copy neutralized, build **12**
- [x] `eas.json` production — coach flags **on**; Classes/coach UI **role-gated** (not global off)
- [x] Edge invite pages — App Store default, not TestFlight (`supabase/functions/_shared/installUrls.ts`)
- [x] ASC App Review notes + reply — done by you
- [ ] Deploy edge functions: `supabase functions deploy game-invite rally-invite --linked`
- [ ] Paste production notes in ASC — [store-review-test-accounts.md](./store-review-test-accounts.md) *(if not already)*
- [ ] EAS `production` build from branch with Build 12 fixes
- [ ] Submit for review

Contract: [`module-production-surface.md`](./contracts/module-production-surface.md)

### Submit timing (don’t waste a build)

While Apple reviews Build 11, keep iterating on `fix/app-store-build-12` **without** uploading a new build until you are ready. Each ASC submit consumes a review cycle.

| Track | Build profile | Coach flags | Who |
|-------|---------------|-------------|-----|
| **App Store submit** | `production` | On, role-gated | Reviewer `marcus` sees pickup-only; coaches/parents see coach UI |
| **Internal QA** | `preview` or `production` TestFlight | On | You + coaches — set `is_coach` or enrollments on test accounts |

**Coach testers:** `update profiles set is_coach = true where email = '…'` or use parent enrollment seed — not “turn flags off.”

---

## Build 6 — Jun 17, 2026 (2.5.4, 2.1(a), 5.1.1(v))

**Submission ID:** `6b9effbb-be23-4cf0-b78e-100fced6d0bd`  
**Review device:** iPad Air 11-inch (M3)  
**Version:** 1.0 (6)

**Goal:** Fix all three issues in **one resubmit** — do not reply-only without a new build for 2.5.4 and 5.1.1(v).

---

## Issue 1 — Guideline 2.5.4 (Background location)

### What Apple said

`UIBackgroundModes` includes `location`, but reviewers found **no feature that needs persistent background GPS**.

### Do we need it?

**No.** Rally uses **foreground-only** location:

- `requestForegroundPermissionsAsync` / `getForegroundPermissionsAsync` only
- `getCurrentPositionAsync` + polling while app is open (`locationService.ts`)
- Geofence checks run on foreground location — not background tracking
- Push uses `remote-notification` background mode only

### Fix (code — done in repo)

| File | Change |
|------|--------|
| `ios/RallyApp/Info.plist` | Remove `location` from `UIBackgroundModes`; remove `NSLocationAlways*` keys |
| `android/app/src/main/AndroidManifest.xml` | Remove `ACCESS_BACKGROUND_LOCATION` |

### Resubmit checklist

- [ ] New EAS **production** iOS build (Build 7+)
- [ ] Verify Info.plist in archived build has **no** `location` under `UIBackgroundModes`
- [ ] App Review reply: *"Removed background location — app uses When In Use only for Discover/map."*

**Do not** send a screen recording of background location — we don't have that feature.

---

## Issue 2 — Guideline 2.1(a) (Demo account / empty app)

### What Apple said

Could not access the app or verify features (e.g. **Inbox** empty). Need username + password in **App Review Information** with **pre-populated content**.

### Likely causes (Build 6)

1. Credentials only in TestFlight notes — **not** in App Store Connect → App Review Information
2. Demo seed not on **production** Supabase project used by store build
3. `marcus@…` login failed (wrong password / user missing)
4. Reviewer on iPad — app runs iPhone layout; should still work if login succeeds

### Fix (ops — before next submit)

**Status (2026-06-17):** Linked project `casljueycxsqexpkdiuq` re-seeded via CLI:

```bash
cd RallyApp
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
```

Verified: `marcus@rally-mvrhoops.demo` exists · **Julian Fisher Park Regulars** (11 members) · 5 activities.

**Note:** Full auth-user seed requires `SUPABASE_SERVICE_ROLE_KEY` in local `.env`:

```bash
node scripts/seed-monrovia-basketball-rally-demo.mjs
```

SQL seed is enough when demo auth users already exist.

**A. Re-seed production-linked database** (same day as upload)

```bash
cd RallyApp
SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-monrovia-basketball-rally-demo.mjs
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
supabase db query --linked -f supabase/scripts/seed_beta_test_data.sql
```

**B. App Store Connect → App → App Review Information**

See current production paste: [store-review-test-accounts.md](./store-review-test-accounts.md) (Build 12+).

| Field | Value |
|-------|--------|
| Sign-in required | Yes |
| Username | `marcus@rally-mvrhoops.demo` |
| Password | `MonroviaHoops26!` |

**C. Notes for reviewer** — **superseded.** Use [store-review-test-accounts.md](./store-review-test-accounts.md) only. Do not use the Build 6 “closed LA sports beta” paste.

**D. Smoke test on physical device with production build**

- [ ] Log in as `marcus@…` on TestFlight build **before** submit
- [ ] Inbox shows at least one Rally row
- [ ] Play shows games

### Resubmit checklist

- [ ] Seed verified same day as upload
- [ ] App Review Information filled (not only TestFlight)
- [ ] Reply: *"Demo account seeded with Inbox Rally and games — credentials in App Review Information."*

---

## Issue 3 — Guideline 5.1.1(v) (Account deletion)

### What Apple said

App supports account creation but **no in-app account deletion**. Web-only or email-only is **not sufficient** (except regulated industries).

### Current state

- Profile has **Sign out** only
- Play Console references https://kenpoon555.github.io/rally/delete-account — **not in the iOS app**

### Required for Apple

In-app path, e.g. **Profile → Delete account**:

1. Confirmation step (type DELETE or second alert)
2. Deletes or anonymizes user data + Supabase auth user
3. Returns to welcome / logged-out state
4. **Screen recording** on physical device for App Review notes (first resubmit after feature ships)

### Implementation (Build 7+)

| Layer | Work | Status |
|-------|------|--------|
| UI | Profile → Legal → **Delete account** (double confirm) | ✅ |
| API | `delete_own_account()` RPC | ✅ migration `072` |
| Client | `userService.deleteOwnAccount()` | ✅ |

Deploy migration before store build:

```bash
supabase db query --linked -f supabase/migrations/072_delete_own_account.sql
```

### Resubmit checklist

- [ ] Delete account UI shipped in Build 7+
- [ ] Recording: sign in → Profile → Delete account → confirm → logged out
- [ ] Upload recording URL or attach in App Review Information notes
- [ ] Privacy policy updated to mention in-app deletion

**Blocker:** This is the **largest** fix — cannot pass 5.1.1(v) without it.

---

## New build pre-flight (avoid repeat rejection)

| # | Check | Guideline |
|---|--------|-----------|
| 1 | No `location` in `UIBackgroundModes` | 2.5.4 |
| 2 | No `ACCESS_BACKGROUND_LOCATION` on Android | 2.5.4 / Play |
| 3 | Only `NSLocationWhenInUseUsageDescription` (no Always) | 2.5.4 |
| 4 | Demo login works on **production** build same day as submit | 2.1(a) |
| 5 | App Review Information has marcus credentials | 2.1(a) |
| 6 | Inbox + Play populated for demo user | 2.1(a) |
| 7 | **Delete account** in Profile | 5.1.1(v) |
| 8 | CPS flags **off** in EAS production env (no minors UI in v1.0) | 2.1(a) / safety |
| 9 | Bump `buildNumber` / `CFBundleVersion` | — |

---

## Suggested order of work

1. **Today:** Remove background location (done) + verify on device
2. **This week:** Ship **Delete account** (P0 for resubmit)
3. **Same day as upload:** Re-seed production + TestFlight login smoke test
4. **Submit Build 7** with App Review notes + deletion screen recording
5. **Reply in ASC** referencing all three fixes

---

## Related

- [store-review-test-accounts.md](./store-review-test-accounts.md)
- [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md)
- [launch-roadmap-jun-2026.md](./launch-roadmap-jun-2026.md)
