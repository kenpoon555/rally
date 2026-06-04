# Firebase CLI — refresh iOS `GoogleService-Info.plist`

Project: **rally-32e72** · iOS bundle: **com.rallyapp**

## CLI status on this machine (checked 2026-05-27)

| Tool | Status |
|------|--------|
| **Firebase CLI** (`firebase-tools`) | Yes — use **`npx firebase-tools@latest`** (Homebrew install is broken: missing template files) |
| **Logged in** | Was **kunyupoon495@gmail.com** but refresh token **expired** → logged out; you must **`firebase login --reauth`** |
| **Apple Developer** | **No official CLI** for “accept PLA” or listing agreements. Use [developer.apple.com/account](https://developer.apple.com/account) in the browser. Optional: **fastlane** + App Store Connect API key (heavier setup). |

---

## Step 1 — Re-authenticate Firebase (required once)

In Terminal:

```bash
cd /Users/kenpoon/Rally/RallyApp
npx firebase-tools@latest login --reauth
```

Browser opens → sign in with the Google account that owns **rally-32e72**.

Verify:

```bash
npx firebase-tools@latest projects:list
# should include rally-32e72
```

---

## Step 2 — List apps and download plist

```bash
npx firebase-tools@latest apps:list --project rally-32e72
```

Find the **iOS** app with bundle **`com.rallyapp`**. Copy its **App ID** (format `1:567443883022:ios:xxxxxxxx`).

Download plist into the repo:

```bash
npx firebase-tools@latest apps:sdkconfig IOS APP_ID_HERE \
  --project rally-32e72 \
  --out ios/RallyApp/GoogleService-Info.plist
```

Replace `APP_ID_HERE` with the iOS app id from the list.

If there is **no iOS app** with `com.rallyapp`:

1. [Firebase Console](https://console.firebase.google.com/project/rally-32e72/overview) → **Add app** → **iOS**
2. Bundle ID: **com.rallyapp**
3. Download plist from the wizard, or repeat Step 2.

---

## Step 3 — Commit

```bash
git add ios/RallyApp/GoogleService-Info.plist
git commit -m "Update GoogleService-Info.plist for com.rallyapp"
```

---

## Apple Developer (PLA / bundle id) — browser only

1. [developer.apple.com/account](https://developer.apple.com/account) → accept **Program License Agreement** if prompted.
2. [Identifiers](https://developer.apple.com/account/resources/identifiers/list) → confirm **com.rallyapp** exists (create **App IDs** if missing).
3. Retry: `npx eas-cli credentials -p ios` → profile **preview** → bundle **com.rallyapp**.

`eas credentials` is the practical “CLI” for Apple **signing**, not for reading PLA status.
