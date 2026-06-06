# Firebase Cloud Messaging + Apple (Phase 4 console steps)

Last updated: 2026-05-06

This complements [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md). The app already includes native Firebase wiring (`GoogleService-Info.plist`, `google-services.json`, `index.js` background handler, `notificationService.ts`).

## 1. Firebase project (`rally-32e72` per `google-services.json`)

1. Open [Firebase Console](https://console.firebase.google.com/) → your project.
2. **Project settings** → General:
   - Confirm an **iOS** app with bundle ID `com.rallyapp` and `GoogleService-Info.plist` downloaded into `ios/RallyApp/`.
   - Confirm an **Android** app with package `com.rallyapp` and `google-services.json` at `android/app/google-services.json`.

## 2. Apple Push Notification service (iOS)

1. Apple Developer → **Certificates, Identifiers & Profiles** → Keys → create an **APNs Auth Key** (.p8) with Apple Push Notifications service enabled. Note **Key ID** and **Team ID**.
2. Firebase Console → Project settings → **Cloud Messaging** → **Apple app configuration** → upload the APNs key (or use certificate flow if you prefer legacy).
3. Xcode → target **RallyApp** → **Signing & Capabilities** → ensure **Push Notifications** capability is enabled for release builds.

## 3. Android

1. Firebase Console → Android app → confirm `google-services.json` matches release signing (package name `com.rallyapp`).
2. If using Play App Signing, add **SHA-1 / SHA-256** from Play Console to Firebase project settings as documented by Google (needed for some Google services; FCM often works once `google-services.json` is correct).

## 4. Device validation

Follow Cases 1–5 in [phase-4-notifications-validation-checklist.md](phase-4-notifications-validation-checklist.md); confirm `user_device_tokens` rows via SQL in that doc.

## 5. Common failures

| Symptom | Check |
| ------- | ----- |
| iOS token never registers | APNs key not uploaded to Firebase; wrong bundle ID; Push capability off |
| Android token null | `google-services.json` missing or wrong package; Google Play services on device |
| Token in DB but no push | Server/serverless sender not implemented yet — test from Firebase Console “Send test message” first |
