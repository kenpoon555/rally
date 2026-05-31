**Archived:** 2026-03-14 — Firebase config task completed; both `GoogleService-Info.plist` (iOS) and `google-services.json` (Android) in place; `pod install` run. Revisit from `docs/archive/` if re-onboarding or new Firebase project.

---

# Firebase config files setup

Rally uses **Firebase Cloud Messaging (FCM)** for push notifications (join requests, activity updates, etc.). The SDK needs per-app config so it knows which Firebase project to use. That’s what these files are for.

## Why you need them

| File | Platform | Purpose |
|------|----------|--------|
| `GoogleService-Info.plist` | iOS | Tells the Firebase iOS SDK your project ID, API keys, and app identity. Without it, `FirebaseApp.configure()` is never called (see `ios/RallyApp/AppDelegate.swift`) and push won’t work on iOS. |
| `google-services.json` | Android | Same for the Android SDK. The app’s `android/app/build.gradle` only applies the Google Services plugin when this file exists; otherwise you get a warning and FCM is disabled on Android. |

Without both files, the app still builds and runs, but push notifications won’t work on either platform.

---

## Step-by-step setup

### 1. Create or use a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create a new project (or pick an existing one).
3. Note the project name; you’ll use it for both iOS and Android.

### 2. Add the iOS app and get `GoogleService-Info.plist`

1. In the project overview, click **Add app** → **iOS**.
2. **iOS bundle ID**: use the same as Xcode. For this repo it is typically **`org.reactjs.native.example.RallyApp`**.  
   To confirm: open `RallyApp.xcworkspace` in Xcode → select the **RallyApp** target → **Signing & Capabilities** (or **General**) and check **Bundle Identifier**.
3. App nickname and App Store ID are optional; you can skip.
4. Click **Register app**.
5. Download **`GoogleService-Info.plist`**.
6. Place it in the app target folder so Xcode ships it with the app:
   - **Path:** `RallyApp/ios/RallyApp/GoogleService-Info.plist`
   - In Xcode: drag the file into the **RallyApp** group under the RallyApp target and ensure **Copy items if needed** and the **RallyApp** target are checked.
7. Finish the wizard (you can skip adding the Firebase SDK step; the React Native Firebase pods are already in the project).

### 3. Add the Android app and get `google-services.json`

1. In the same Firebase project, click **Add app** → **Android**.
2. **Android package name:** **`com.rallyapp`** (must match `applicationId` in `android/app/build.gradle`).
3. App nickname and debug signing certificate are optional; you can skip.
4. Click **Register app**.
5. Download **`google-services.json`**.
6. Place it in the app module directory:
   - **Path:** `RallyApp/android/app/google-services.json`
   - No extra Gradle or Xcode steps; the existing `build.gradle` applies the Google Services plugin when this file is present.

### 4. Sync and build

- **iOS:**  
  `cd RallyApp/ios && pod install`  
  Then build from Xcode or:  
  `cd RallyApp && npx react-native run-ios`

- **Android:**  
  `cd RallyApp && npx react-native run-android`

If both config files are in place, the Firebase-related build warnings (e.g. “google-services.json not found”) should go away and FCM can be used for push.

### 5. (Optional) iOS push: APNs

For push to work on real iOS devices, you must configure Apple Push Notification service (APNs) in Firebase (e.g. upload an APNs key or certificate in **Project settings → Cloud Messaging**). Simulator push is limited; use a real device to validate. See `docs/phase-4-notifications-validation-checklist.md` for end-to-end notification tests.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Create/select Firebase project |
| 2 | Add iOS app (bundle ID = Xcode Bundle Identifier) → download `GoogleService-Info.plist` → put in `ios/RallyApp/` and add to Xcode target |
| 3 | Add Android app (package name = `com.rallyapp`) → download `google-services.json` → put in `android/app/` |
| 4 | `pod install` (iOS), then build both platforms |

Acceptance: both files in place; iOS and Android builds succeed; you can proceed to token registration and test push (Phase 4 checklist).
