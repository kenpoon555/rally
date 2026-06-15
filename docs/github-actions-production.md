# GitHub Actions → EAS production builds + store submit

Push to branch **`production`** runs tests, checks EAS production env, then **builds and submits** Android (Play internal) and iOS (TestFlight) via `--auto-submit`.

Workflow: [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)

Builds and submissions: [expo.dev builds](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds) · [expo.dev submissions](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/submissions)

---

## Branch flow (full pipeline)

```text
dev        →  PR → preview     →  CI on PR; preview EAS **manual** (Actions workflow_dispatch)
preview    →  PR → main        →  CI only (stable)
main       →  PR → production  →  production build + store submit
```

**Suggested order when promoting Stage 1:**

1. Merge **dev → preview** (preview install build).
2. Merge **preview → main**.
3. Merge **main → production** (production build + Play internal + TestFlight submit).

---

## One-time setup

| Step | Command / place |
|------|------------------|
| GitHub secret | `EXPO_TOKEN` (same as preview) |
| EAS env | `eas env:list --environment production` — need `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Android signing | `eas credentials -p android` (production profile) |
| iOS signing | `eas credentials -p ios` (production / App Store distribution) |
| **Play submit key on EAS** | See [Store submit credentials on EAS](#store-submit-credentials-on-eas) below |
| **ASC API key on EAS** | Same section |
| Play / App Store apps | Play: `app.rally.sports` · iOS: `com.rallyapp` (`ascAppId` in `eas.json`) |

See [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md) and [eas-build-and-credentials.md](./eas-build-and-credentials.md).

---

## Store submit credentials on EAS

CI cannot read keys from your laptop. Submit credentials must live on **Expo/EAS**, not as local paths in `eas.json`.

When `eas.json` has **no** `serviceAccountKeyPath` (Android) or `ascApiKeyPath` / `ascApiKeyId` / `ascApiKeyIssuerId` (iOS), `eas submit` and `--auto-submit` use **EAS Credentials Service** (keys stored on expo.dev).

### Quick setup (recommended)

From `RallyApp/` with Expo logged in locally:

```bash
node scripts/eas-store-submit-credentials.mjs
```

Defaults:

- Play JSON: `~/.config/rally/eas-play-submit.json`
- ASC `.p8`: `~/.config/rally/asc-api-key.p8`

Override paths:

```bash
PLAY_KEY=/path/to/play-sa.json ASC_KEY=/path/to/AuthKey_XXXX.p8 node scripts/eas-store-submit-credentials.mjs
```

### Android — Google Play service account

**What you need:** A Google Cloud service account JSON with Play Console access (Admin or Release manager on the app).

**Option A — script (above)**  
Uploads the JSON to your Expo account and assigns it to `app.rally.sports` for submissions.

**Option B — EAS CLI (interactive)**

```bash
cd RallyApp
eas credentials -p android
# → production → Google Service Account Key for Play Store submissions
# → Upload a new service account key (or choose existing)
```

**Option C — Expo dashboard**

1. [expo.dev](https://expo.dev) → account **kendrewpoon** → **Credentials**
2. **Google Service Account Keys** → upload JSON
3. Project **rallyapp** → Android → assign key for **Submissions**

**Create the service account (if needed):**

```bash
# Example — adjust project id / SA name to match your GCP setup
gcloud iam service-accounts create eas-play-submit --display-name="EAS Play Submit"
gcloud iam service-accounts keys create ~/.config/rally/eas-play-submit.json \
  --iam-account=eas-play-submit@YOUR_GCP_PROJECT.iam.gserviceaccount.com
```

Then in [Google Play Console](https://play.google.com/console) → **Users and permissions** → invite the service account email with release permissions.

### iOS — App Store Connect API key

**What you need:** `.p8` key from App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API**.

**Option A — script (above)**  
Uploads key `3BV5G9J3QB` (or creates on EAS if missing) and assigns it for submissions on `com.rallyapp`.

**Option B — EAS CLI (interactive)**

```bash
cd RallyApp
eas credentials -p ios
# → production → App Store Connect API Key → Add new or choose existing
```

**Option C — Expo dashboard**

1. [expo.dev](https://expo.dev) → **Credentials** → **App Store Connect API Keys** → upload `.p8`
2. Project **rallyapp** → iOS → assign for **Submissions**

**Keep in `eas.json` (not secret):**

```json
"ios": {
  "appleId": "kunyupoon495@gmail.com",
  "appleTeamId": "68JKW6NXF6",
  "ascAppId": "6777569179"
}
```

Do **not** commit `ascApiKeyPath` or `serviceAccountKeyPath` — those break CI.

### Verify

```bash
# Should succeed without local key files in eas.json
eas submit --profile production --platform android --latest --non-interactive
eas submit --profile production --platform ios --latest --non-interactive
```

Or check expo.dev → project → **Credentials** → Android/iOS submission keys.

---

## Create the `production` branch (first time)

After **main** has the code you want to ship:

```bash
cd RallyApp
git fetch origin
git checkout -b production origin/main
git push -u origin production
```

That push runs **Deploy production (EAS)** automatically (build + submit).

---

## CI vs CD

| Event | Workflow | What happens |
|-------|----------|----------------|
| **PR** → `main`, `preview`, or `production` | `ci.yml` | Tests + lint (+ preview env check on PRs) |
| **Push / merge** to `preview` | `deploy-preview.yml` | Preview EAS builds (no store submit) |
| **Push / merge** to `production` | `deploy-production.yml` | Production build + **auto-submit** |
| **Push** to `main` | `ci.yml` | Tests only |

---

## Manual: build or re-submit

GitHub → **Actions** → **Deploy production (EAS)** → **Run workflow**

- **platform:** `android` / `ios` / `all`
- **submit:** re-run `eas submit --latest` without a new build (after a successful build)

Local full pipeline:

```bash
eas build --profile production --platform all --auto-submit --non-interactive
```

---

## Troubleshooting

### iOS build uploaded but missing in TestFlight

EAS can report “Submitted to App Store Connect” while TestFlight still hides the build until **export compliance** is answered. Set this once in native `Info.plist` (bare workflow):

```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

Also mirror in `app.json` → `expo.ios.infoPlist` for documentation. Rally uses HTTPS only (Supabase, etc.), so `false` is correct.

### Wrong home-screen icon after deploy

OS icons come from **native** assets (`ios/.../AppIcon.appiconset`, `android/.../mipmap-*`), not JS. After changing `assets/branding/`:

```bash
python3 scripts/build-app-icon-assets.py
./scripts/generate-app-icons.sh
```

Then run a new EAS production build.

---

## Related

- Preview pipeline: [github-actions-preview.md](./github-actions-preview.md)
