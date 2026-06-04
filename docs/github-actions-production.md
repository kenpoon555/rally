# GitHub Actions → EAS production builds

Push to branch **`production`** runs tests, checks EAS production env, then queues **EAS `production` builds** for Android and iOS.

Workflow: [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml)

**This does not publish to the public App Store / Play Store on every push.** Builds land on [expo.dev builds](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds). Submit is optional (manual workflow or `eas submit`).

---

## Branch flow (full pipeline)

```text
dev        →  PR → preview     →  merge triggers preview EAS builds (internal testers)
preview    →  PR → main        →  CI only (stable)
main       →  PR → production  →  merge triggers production EAS builds (store-ready binaries)
```

**Suggested order when promoting Stage 1:**

1. Merge **dev → preview** (preview install build).
2. Merge **preview → main** (PR #8).
3. Open **main → production** (first merge creates the branch and starts production builds).

---

## One-time setup

| Step | Command / place |
|------|------------------|
| GitHub secret | `EXPO_TOKEN` (same as preview) |
| EAS env | `eas env:list --environment production` — need `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Android signing | `eas credentials -p android` (production profile) |
| iOS signing | `eas credentials -p ios` (production / App Store distribution) |
| Play / App Store | Play Console app + App Store Connect app linked for `eas submit` |

See [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md) and [eas-build-and-credentials.md](./eas-build-and-credentials.md).

---

## Create the `production` branch (first time)

After **main** has the code you want to ship:

```bash
cd RallyApp
git fetch origin
git checkout -b production origin/main   # or: git checkout main && git pull && git checkout -b production
git push -u origin production
```

That push runs **Deploy production (EAS)** automatically.

---

## CI vs CD

| Event | Workflow | What happens |
|-------|----------|----------------|
| **PR** → `main`, `preview`, or `production` | `ci.yml` | Tests + lint (+ preview env check on PRs) |
| **Push / merge** to `preview` | `deploy-preview.yml` | Preview EAS builds |
| **Push / merge** to `production` | `deploy-production.yml` | Production EAS builds |
| **Push** to `main` | `ci.yml` | Tests only |

---

## Manual: build or submit

GitHub → **Actions** → **Deploy production (EAS)** → **Run workflow**

- **platform:** `android` / `ios` / `all`
- **submit:** enable only after a successful production build, to run `eas submit --latest`

---

## Related

- Preview pipeline: [github-actions-preview.md](./github-actions-preview.md)
