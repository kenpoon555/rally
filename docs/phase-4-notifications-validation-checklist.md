# Phase 4 Notifications Validation Checklist

Last updated: 2026-02-23

Use this checklist to validate push setup and runtime behavior across iOS and Android.

## Preconditions

- Firebase project exists with iOS and Android apps registered.
- `GoogleService-Info.plist` is added to Xcode target (`ios/RallyApp/`).
- `google-services.json` exists at `android/app/google-services.json`.
- APNs is configured in Firebase for iOS.
- App has latest code with:
  - `initializeNotificationsForUser()` token registration and refresh sync.
  - Foreground/open handlers in `App.tsx`.
  - Background handler registration in `index.js`.

## Platform Matrix

- [ ] iOS pass
- [ ] Android pass

## Case 1: Permission Prompt + Persisted Grant

Steps:

1. Sign in with a valid account.
2. Trigger permission flow on first app load.
3. Deny once, then enable from OS settings.
4. Re-open app.

Expected:

- App does not crash when permission is denied.
- After re-enable, token registration resumes on next app load.

## Case 2: Token Registration in `user_device_tokens`

Steps:

1. Sign in with account A.
2. Query `user_device_tokens`.
3. Reinstall app or clear app data and sign in again.

Expected:

- Exactly one row per `(user_id, device_token)` pair.
- `updated_at` refreshes on re-registration/upsert.
- `platform` is `ios` or `android` correctly.

Verification SQL:

```sql
select user_id, device_token, platform, created_at, updated_at
from user_device_tokens
order by updated_at desc
limit 30;
```

## Case 3: Token Refresh Lifecycle

Steps:

1. Keep app signed in.
2. Trigger token rotation scenario (reinstall/app data reset or Firebase token refresh event).
3. Re-query `user_device_tokens`.

Expected:

- New token gets upserted successfully.
- No duplicate row for same `(user_id, device_token)`.

## Case 4: Foreground Notification Handling

Steps:

1. Keep app in foreground.
2. Send test push from Firebase console to current device token.

Expected:

- Foreground handler receives payload.
- App remains responsive (no crash/UI deadlock).

## Case 5: Background + Cold Start Handling

Steps:

1. Put app in background.
2. Send test push and tap it.
3. Kill app, send another push, tap it.

Expected:

- Background message is processed.
- Notification open handler receives payload for both background-open and cold-start-open paths.

## Failure Scenarios

- [ ] Permission denied: no crash, graceful fallback.
- [ ] Invalid token: backend write error does not break sign-in session.
- [ ] Duplicate token row does not appear.
- [ ] Notification open payload does not break navigation flow.

## Exit Criteria

- [ ] All five cases pass on iOS.
- [ ] All five cases pass on Android.
- [ ] Token lifecycle is stable in `user_device_tokens`.
- [ ] Foreground/background/cold-start handlers confirmed.

## Results Logging

Add run-date notes and platform-specific issues below. If failures block release, mirror them in `docs/release-readiness-checklist.md`.

**Template (copy and fill per run):**

```
### Run: YYYY-MM-DD | Tester: _______

| Case | iOS | Android | Notes |
|------|-----|---------|-------|
| 1 Permission + Persisted Grant | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | |
| 2 Token in user_device_tokens | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | |
| 3 Token Refresh Lifecycle | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | |
| 4 Foreground Handling | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | |
| 5 Background + Cold Start | ☐ Pass / ☐ Fail | ☐ Pass / ☐ Fail | |

Platform matrix: iOS ☐ pass / ☐ fail | Android ☐ pass / ☐ fail

Issues (if any):
-
```

---
