# GitHub Actions → EAS preview builds

Push to branch **`preview`** runs tests, then queues **EAS `preview` builds for Android and iOS** (`--platform all`). Install links appear on [expo.dev](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds) when each build finishes (~10–25 min per platform, in parallel).

Workflow file: [`.github/workflows/deploy-preview.yml`](../.github/workflows/deploy-preview.yml)

---

## Step 1 — Create an Expo access token

1. Sign in at [expo.dev](https://expo.dev) as **kendrewpoon**.
2. Open **Account settings → Access tokens**:  
   https://expo.dev/accounts/kendrewpoon/settings/access-tokens
3. Click **Create token** (or **Add token**).
4. Name it e.g. `github-actions-rally`.
5. Copy the token **once** (you will not see it again).

This token lets GitHub trigger builds on your Expo account. It is **not** your Supabase key.

---

## Step 2 — Add the token to GitHub (secret)

Repo: **kenpoon555/rally** (RallyApp is the git root).

### Option A — GitHub CLI (you already have `gh`)

```bash
cd /Users/kenpoon/Rally/RallyApp
gh secret set EXPO_TOKEN --repo kenpoon555/rally
```

Paste the Expo token when prompted. Nothing is printed back.

Verify:

```bash
gh secret list --repo kenpoon555/rally
```

You should see `EXPO_TOKEN`.

### Option B — GitHub website

1. https://github.com/kenpoon555/rally/settings/secrets/actions  
2. **New repository secret**  
3. Name: `EXPO_TOKEN`  
4. Value: paste the Expo token → **Add secret**

---

## Step 3 — Commit the workflow and create `preview` branch

From `RallyApp` (only commit what you are ready to ship; workflow + scripts are required):

```bash
cd /Users/kenpoon/Rally/RallyApp

git add .github/workflows/deploy-preview.yml
git add docs/github-actions-preview.md docs/eas-build-and-credentials.md
git add scripts/eas-sync-env.sh package.json
# …add other files you want on preview…

git commit -m "Add GitHub Actions EAS preview deploy on preview branch"

git checkout -b preview
git push -u origin preview
```

Future workflow: merge or push to **`preview`** → CI runs → EAS build starts in the cloud.

---

## CI vs CD (what runs when)

| Event | Workflow | What happens |
|-------|----------|----------------|
| **PR** → `main` or `preview` | [`ci.yml`](../.github/workflows/ci.yml) | `npm test` + lint + check EAS has `SUPABASE_*` — **no** phone build |
| **Push / merge** to `preview` | [`deploy-preview.yml`](../.github/workflows/deploy-preview.yml) | Same tests, then **EAS Android + iOS** builds |
| **Push** to `main` only | `ci.yml` | Tests only (no deploy) |

**Recommended git flow**

```text
feature/my-change  →  PR into main     (CI must pass)
main               →  PR into preview  (CI must pass)
merge preview      →  auto deploy      (install from Expo)
```

You do **not** need unit tests for every screen. Add tests for **logic that broke before** (sport config, distance filter, parsers). Device flows (login, map, push) stay **manual smoke** on the preview build.

**CI does not replace:** simulator passes, or installing the preview APK/IPA on a phone.

---

## Step 4 — Manual run (optional)

GitHub → **Actions** → **Deploy preview (EAS)** → **Run workflow** → choose `android` / `ios` / `all`.

**iOS prerequisite (one time):** `eas credentials -p ios` for profile **preview** (Apple Developer account). Without this, the iOS job in CI will fail while Android may still succeed.

---

## How to test every update (your loop)

You do **not** rebuild on your Mac each time. Use this rhythm:

### Daily / feature work (fast)

| Step | What |
|------|------|
| 1 | Code on `main` or `feature/…` |
| 2 | Run **simulator/emulator** locally (`npm start` + `run-ios` / `run-android`) with `.env` |
| 3 | `npm test` or `npm run verify` before you merge |

Use this for UI and logic until you want a **real phone** build.

### When you want phones to test (preview deploy)

| Step | What |
|------|------|
| 1 | Merge or push your changes to branch **`preview`** |
| 2 | GitHub **Actions** → workflow **Deploy preview (EAS)** → wait for green ✓ (queues EAS; does not wait for compile) |
| 3 | Open **[Expo builds](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds)** → find the two new builds for your commit (Android + iOS) |
| 4 | **Android:** open build → **Install** / QR → install APK (may need “install unknown apps”). |
| 5 | **iOS:** open build → install via link/QR (**device UDID must be registered** for internal/preview; register in Apple Developer → Devices, then re-run credentials if needed). |
| 6 | Smoke test: login → Discover → create activity |

Each push to **`preview`** = **new build IDs**. Uninstall old preview app only if install fails; otherwise installing over the previous preview is usually fine.

### Know which build you’re testing

On the Expo build page, check **Git commit** / time matches your push. In GitHub Actions, the job summary links to the builds dashboard and shows the commit SHA.

### One platform only

Actions → **Run workflow** → choose `android` or `ios` if you only changed JS and want to save queue time (native changes still need both eventually).

---

## What runs where

| Step | Where | What |
|------|--------|------|
| `npm run verify` | GitHub runner | Tests + lint (~minutes) |
| `eas build --profile preview` | Expo EAS servers | Native compile + sign (~10–20+ min) |
| Secrets for app | **EAS env** (`SUPABASE_*`) | Already set; `eas-sync-env.sh` on build |
| Signing | **EAS credentials** | Android keystore + iOS preview certs |

GitHub does **not** need your `.env` file if EAS env is populated.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EXPO_TOKEN` invalid / missing | Repeat Step 2; token must be for account **kendrewpoon** |
| EAS build fails: keystore | Run `eas credentials -p android` once (already done for you) |
| App missing Supabase on device | Rebuild after `eas-sync-env.sh` exists; confirm `eas env:list --environment preview` |
| iOS build fails in CI | Set up `eas credentials -p ios` first; use manual workflow with `ios` |
| Apple **403 PLA Update** | Log in at [developer.apple.com](https://developer.apple.com/account) → accept the **Program License Agreement**, then retry `eas credentials -p ios` |
| Wrong bundle id `org.reactjs.native.example…` | Native iOS should be **`com.rallyapp`** (see `app.json`). Re-run credentials after fixing; update Firebase iOS app + re-download `GoogleService-Info.plist` if push breaks |
