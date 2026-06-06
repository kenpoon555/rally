# Phase 4: Supabase secrets for push (`send-push`)

The app calls the Edge Function **`send-push`** after a guest creates a join request. The function sends FCM to the host’s registered device tokens.

## 1. Firebase Server Key

**Option A — Firebase Console**

1. [Firebase Console](https://console.firebase.google.com/) → **rally-32e72** → Project settings → **Cloud Messaging**.
2. Copy **Server key** under Cloud Messaging API (Legacy).

**Option B — gcloud (works when `firebase` CLI is broken)**

The legacy FCM server key is usually the **Browser key (auto created by Firebase)**:

```bash
gcloud config set project rally-32e72
gcloud services enable fcm.googleapis.com
gcloud services api-keys list --project=rally-32e72
# Copy the uid for "Browser key (auto created by Firebase)", then:
KEY=$(gcloud services api-keys get-key-string BROWSER_KEY_UID --project=rally-32e72 --format='value(keyString)')
```

Repo is linked to Firebase via `RallyApp/.firebaserc` (`default`: `rally-32e72`).

**Firebase CLI note:** If `firebase` crashes with a missing `hosting/init.js` template, reinstall: `brew reinstall firebase-tools` (or use Console / gcloud above).

## 2. Set Supabase secret

```bash
cd RallyApp
supabase secrets set FIREBASE_SERVER_KEY="$KEY" --project-ref casljueycxsqexpkdiuq
supabase secrets list --project-ref casljueycxsqexpkdiuq   # should show FIREBASE_SERVER_KEY
```

Or Supabase Dashboard → **Project Settings → Edge Functions → Secrets**.

**Status (2026-05-28):** `FIREBASE_SERVER_KEY` was set on project `casljueycxsqexpkdiuq` via CLI.

## 3. Deploy the function

From repo (if CLI is linked):

```bash
supabase functions deploy send-push --project-ref casljueycxsqexpkdiuq
```

The function is also in `supabase/functions/send-push/index.ts` and can be deployed via Supabase MCP / Dashboard.

## 4. Verify

1. Sign in on **two physical devices** (host + guest). Simulators do not receive FCM reliably.
2. Confirm host has a row in `user_device_tokens`.
3. Guest requests to join a game.
4. Host should get a push; tapping it opens **Activity Detail** for that game.

If push is skipped in dev, check Metro logs for `Push dispatch skipped` — usually missing secret or no host token.

## App behavior (2026-05-28)

| Piece | Location |
| ----- | -------- |
| Invoke on join | `activityService.createJoinRequest` → `pushDispatchService.notifyHostOfJoinRequest` |
| Edge Function | `supabase/functions/send-push` |
| Token register | `notificationService.initializeNotificationsForUser` (iOS + Android) |
| Tap / foreground | `App.tsx` → `navigationRef.navigateFromNotificationData` |
| Review prompts | Profile → **Rate your partners** (2h after `start_time + duration`) |
