# GitHub Actions → EAS preview builds

Push to branch **`preview`** runs tests, then queues an **EAS `preview`** build (default: **Android**). You get an install link on [expo.dev](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds) without running `eas build` on your Mac.

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

## Step 4 — Manual run (optional)

GitHub → **Actions** → **Deploy preview (EAS)** → **Run workflow** → choose `android` / `ios` / `all`.

Use **ios** only after `eas credentials -p ios` is done for preview.

---

## What runs where

| Step | Where | What |
|------|--------|------|
| `npm run verify` | GitHub runner | Tests + lint (~minutes) |
| `eas build --profile preview` | Expo EAS servers | Native compile + sign (~10–20+ min) |
| Secrets for app | **EAS env** (`SUPABASE_*`) | Already set; `eas-sync-env.sh` on build |
| Signing | **EAS credentials** | Android keystore (done) |

GitHub does **not** need your `.env` file if EAS env is populated.

---

## Day-to-day flow

1. Develop on **`main`** or a feature branch (local `.env` + simulator).
2. When you want a **testable APK**, merge into **`preview`** and push.
3. Open the build URL from the Actions log or [Expo builds](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds).
4. Install on your phone via QR / link.

You do **not** need to run `eas build` locally unless debugging CI itself.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EXPO_TOKEN` invalid / missing | Repeat Step 2; token must be for account **kendrewpoon** |
| EAS build fails: keystore | Run `eas credentials -p android` once (already done for you) |
| App missing Supabase on device | Rebuild after `eas-sync-env.sh` exists; confirm `eas env:list --environment preview` |
| iOS build fails in CI | Set up `eas credentials -p ios` first; use manual workflow with `ios` |
