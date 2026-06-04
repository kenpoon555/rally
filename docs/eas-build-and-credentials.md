# EAS Build and credentials (RallyApp)

Last updated: 2026-05-22

## Product review builds (do this first)

Goal: install a **preview** build on your phone (or share with testers) so you can review the real app without fighting local Xcode/Android Studio every day.

**Current blockers (must be done once, interactively):**

| Step | Status | Command |
|------|--------|---------|
| Expo project linked | Done | `projectId` in `app.json` |
| Supabase env on EAS (`preview` / `production` / `development`) | Done | `eas env:list --environment preview` — **not** in the credentials menu |
| `.env` generated on cloud build | Done | `eas-build-post-install` → `scripts/eas-sync-env.sh` writes `.env` from EAS env for `react-native-config` |
| Android signing keystore | **You** | `npx eas-cli credentials -p android` → let Expo generate & store keystore |
| iOS certs + provisioning (internal distribution) | **You** | `npx eas-cli credentials -p ios` → sign in with Apple ID; Expo manages certs |

**After credentials exist**, queue installable builds:

```bash
cd RallyApp
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile preview --platform ios
```

When each build finishes, open the build page on [expo.dev](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds) and install via QR link (Android APK/AAB internal) or install on registered iOS devices.

Optional: add Google Maps / Places keys to EAS the same way if Map tab is empty in cloud builds:

```bash
npx eas-cli env:create preview --name GOOGLE_PLACES_API_KEY --value "..." --visibility secret --non-interactive
```

---

## Where config lives (two different things)

| What | Where you set it | Used for |
|------|------------------|----------|
| **Signing credentials** | `eas credentials -p android` / `-p ios` | Keystore, Apple certs — **installable APK/IPA** |
| **Supabase + API keys** | Local **`.env`** (dev) or **`eas env:create`** (cloud) | App runtime: auth, database, maps |
| **FCM / Play submit keys** | Same `eas credentials` menu, separate rows | Push notifications, `eas submit` — optional until Phase 4 / store |

**Supabase is not entered in the credentials wizard.** That screen is only for signing and store/FCM keys.

### Local development

Copy [`.env.example`](../.env.example) → **`.env`** and set:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

### EAS cloud builds

Secrets are stored on Expo (already created for `preview` / `production` / `development`):

```bash
eas env:list --environment preview
```

During each EAS build, **`scripts/eas-sync-env.sh`** runs and writes a temporary **`.env`** so `react-native-config` can bake values into the native app (`.env` is gitignored and is **not** uploaded with your repo).

To add or change Supabase on EAS:

```bash
eas env:create preview --name SUPABASE_URL --value "https://xxxx.supabase.co" --visibility secret --non-interactive --force
eas env:create preview --name SUPABASE_ANON_KEY --value "eyJ..." --visibility secret --non-interactive --force
```

Repeat for `production` when you ship to stores.

---

## Project link

- **EAS project ID:** set in [`app.json`](../app.json) under `expo.extra.eas.projectId` (linked via `eas init`).
- **Owner:** `kendrewpoon` (Expo account).
- Dashboard: `https://expo.dev/accounts/kendrewpoon/projects/rallyapp`

## First-time Android credentials (required once)

Cloud builds need a signing keystore. **Non-interactive** builds cannot generate a keystore the first time; run credentials once interactively:

```bash
cd RallyApp
npx eas-cli credentials -p android
```

Recommended prompts:

1. **Which build profile?** → `preview` (or `All` if offered).
2. **Keystore** → **Set up a new keystore** / **Let Expo handle it** (simplest).
3. Confirm upload to Expo servers (so future `eas build` works from any machine).

After Android credentials exist, preview/production builds can run with `--non-interactive`.

## First-time iOS credentials

```bash
npx eas-cli credentials -p ios
```

Recommended prompts:

1. Sign in with your **Apple Developer** account (paid membership required for device installs beyond your own dev cert limits).
2. Bundle ID **`com.rallyapp`** — must match native `ios/` project.
3. **Distribution certificate** + **provisioning profile** → let Expo generate for **internal/ad hoc** (`preview` profile uses internal distribution).
4. Register test devices in Apple Developer portal if installs fail with “device not registered.”

For **TestFlight** later, use `production` profile + `eas submit`; `preview` is for faster internal review.

## Verify preview builds (after credentials exist)

Queue builds without waiting:

```bash
npx eas-cli build --profile preview --platform android --non-interactive --no-wait
npx eas-cli build --profile preview --platform ios --non-interactive --no-wait
```

Or wait for completion (omit `--no-wait`).

## Profiles

See [`eas.json`](../eas.json): `development` (dev client), `preview` (internal), `production` (store).

## GitHub Actions (auto preview builds)

Push to branch **`preview`** triggers [deploy-preview.yml](../.github/workflows/deploy-preview.yml) (tests, then EAS `preview` Android build).

Setup once: Expo access token → GitHub secret `EXPO_TOKEN`. Full steps: **[github-actions-preview.md](github-actions-preview.md)**.

---

## Troubleshooting

- **“Invalid UUID appId” / stale placeholder:** Remove invalid `expo.extra.eas.projectId`, run `npx eas-cli init --non-interactive --force`.
- **`android.package` ignored:** With a bare `android/` folder, package name comes from native Gradle config; keep it aligned with `app.json` / Firebase.
