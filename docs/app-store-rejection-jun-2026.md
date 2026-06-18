# App Store rejection — Jun 17, 2026 (Build 6)

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

| Field | Value |
|-------|--------|
| Sign-in required | Yes |
| Username | `marcus@rally-mvrhoops.demo` |
| Password | `MonroviaHoops26!` |

**C. Notes for reviewer (paste)**

```text
Rally LA — closed LA sports beta. Email/password only (no Apple Sign In on login screen).

LOGIN
  Email: marcus@rally-mvrhoops.demo
  Password: MonroviaHoops26!

AFTER LOGIN (pre-seeded demo data)
  • Inbox: "Julian Fisher Park Regulars" Rally thread + game chats
  • Today / Play: LA-area pickup games
  • Tap Inbox → Rally row → Chat / Play tabs
  • Profile → Legal (terms, waiver, privacy)

Optional second account (member view):
  Email: derek@rally-mvrhoops.demo
  Password: MonroviaHoops26!

Location: tap Allow When In Use on first Discover/Map prompt (foreground only).

Support: kunyupoon495@gmail.com
Privacy: https://kenpoon555.github.io/rally/privacy-policy
```

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
