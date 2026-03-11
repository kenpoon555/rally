# Auth + Profile Validation Checklist

**Archived:** 2026-02-27 — Cases 4 (Existing User Login) and 6 (Guardrails and Error UX) passed. Revisit from `RallyApp/docs/archive/` if needed.

Last updated: 2026-02-23

Use this checklist to validate the full authentication and profile lifecycle on both iOS and Android.

## Preconditions

- App is running against the intended Supabase project.
- `SUPABASE_URL` and key in `.env` match the same project.
- `profiles` table exists from `supabase/migrations/001_initial_schema.sql`.
- A test email inbox is available for signup verification.
- Optional: open Supabase logs for `auth` and `api` while testing.

## Test Accounts

- Account A (new): never registered before this run.
- Account B (existing): previously created and confirmed.

## Platform Matrix

Run all core cases on both platforms:

- [ ] iOS simulator/device
- [ ] Android emulator/device

For each case below, mark pass/fail per platform.

## Case 1: Fresh Signup (Email)

Steps:

1. Open app and choose signup.
2. Enter Account A email + password + username.
3. Submit signup.
4. If email verification is enabled, complete verification and return via deep link.
5. Land back in app and continue.

Expected:

- Auth user is created successfully.
- No hard failure in app flow after signup.
- User can proceed to authenticated app state after verification/sign-in.

Failure signals:

- Error like "Signup failed: No user created".
- App is stuck between auth and app shell.
- Deep link callback does not restore session.

## Case 2: Profile Auto-Create After Auth

Steps:

1. After Account A is authenticated, let app finish loading.
2. In Supabase SQL editor, run:

```sql
select id, username, email, phone, created_at
from profiles
where id = '<ACCOUNT_A_USER_ID>';
```

Expected:

- Exactly one `profiles` row exists for Account A user id.
- `username` is populated (from signup metadata or fallback).
- No duplicate profile rows.

Failure signals:

- No profile row is created.
- Multiple rows are created.
- App throws profile-not-found errors after successful auth.

## Case 3: Logout -> Login Happy Path

Steps:

1. While authenticated as Account A, sign out.
2. Confirm app returns to auth screen.
3. Sign in again using Account A credentials.

Expected:

- Logout clears in-app session.
- Login succeeds and user is loaded normally.
- Existing profile is reused, not recreated.

Failure signals:

- User remains partially authenticated after logout.
- Login succeeds but profile load fails.
- New profile row is inserted on every login.

## Case 4: Existing User Login Regression

Steps:

1. Sign out from Account A.
2. Sign in using Account B (existing confirmed account).
3. Navigate across home tabs after login.

Expected:

- Existing user login is stable.
- `profiles` lookup works for known account.
- Home shell renders without auth/profile error states.

Failure signals:

- Profile fetch intermittently fails post-login.
- App shows setup/migration errors for valid existing user.

## Case 5: Phone OTP Flow (If Enabled)

Steps:

1. Start phone sign-in with a valid test number.
2. Enter OTP code.
3. Complete auth and wait for user load.

Expected:

- OTP verification succeeds.
- Profile is created on first phone login if missing.
- Profile is reused on subsequent phone logins.

Failure signals:

- OTP verifies but app cannot load user.
- Phone user cannot get/create profile.

## Case 6: Guardrails and Error UX

Steps:

1. Attempt login with invalid password.
2. Attempt signup with already registered email.
3. Trigger email rate limit scenario if possible (or mock).

Expected:

- Errors are user-friendly and actionable.
- No raw/internal technical noise is shown to end user.

Failure signals:

- Cryptic/untranslated backend errors shown directly in UI.
- App crashes or hangs on handled auth errors.

## Supabase Verification Queries

```sql
-- Check latest profiles
select id, username, email, phone, created_at, updated_at
from profiles
order by created_at desc
limit 20;
```

```sql
-- Detect duplicate profile ids (should return zero rows)
select id, count(*) as row_count
from profiles
group by id
having count(*) > 1;
```

## Exit Criteria (Phase 1 Auth Baseline)

- [ ] Signup/login/logout pass on iOS.
- [ ] Signup/login/logout pass on Android.
- [ ] Profile auto-create verified for new user.
- [ ] Existing user login verified without regressions.
- [ ] No blocking auth/profile errors in normal flow.

## Results Logging

- Record run date, platform, and failure notes directly in this file during execution.
- For cross-feature impact discovered during auth tests, also note linkage in `docs/release-readiness-checklist.md`.

- **2026-02-27:** Case 1 (Fresh Signup) passed. Case 2 (Profile Auto-Create) passed. Case 3 (Logout → Login) passed. Case 4 (Existing User Login) passed. Case 6 (Guardrails and Error UX) passed. Android: no error after reinstall (Firebase not loaded on Android). iOS: Map tab max update depth addressed with stable initialRegion + key. Checklist archived; revisit from `docs/archive/` if needed.

---

## How to Work on This (Step-by-Step)

1. **Prereqs:** App builds and runs; `.env` has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Have Account B already created (or create it in a prior run and keep credentials).
2. **iOS run:** Start app on iOS simulator or device (`npx react-native run-ios` or open in Xcode). Work through **Cases 1–6** in order. For each case, tick pass/fail in the Platform Matrix and note any failure in Results Logging below.
3. **Android run:** Start app on Android emulator or device (`npx react-native run-android`). Repeat the same cases; update the same matrix and log.
4. **Supabase checks:** For Case 2, use Supabase Dashboard → SQL Editor; run the query with the real `auth.users.id` (from Auth dashboard or from app logs) to confirm one profile row.
5. **Exit criteria:** When all exit-criteria checkboxes at the bottom are checked for both platforms, Step 1 is done. Optionally add a short "Results" block below with run date and summary.

### Results (fill in after runs)

| Run date   | Platform | Cases passed | Notes |
|------------|----------|--------------|-------|
| 2026-02-27 | —        | 1 2 3 4 6    | Case 1–4 and 6 passed. Android fixed (no Firebase load). Map tab fix: stable initialRegion. Archived. |
|            | iOS      | 1 2 3 4 5 6 |       |
|            | Android  | 1 2 3 4 5 6 |       |
