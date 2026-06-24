# App Store + Play Store — publish prep (Rally)

**Last updated:** 2026-06-03  
**Bundle ID:** `com.rallyapp` · **EAS project:** `rallyapp` (Expo account `kendrewpoon`)  
**Related:** [eas-build-and-credentials.md](./eas-build-and-credentials.md) · [beta-testflight-play-internal.md](./beta-testflight-play-internal.md)

---

## Three distribution stages (don’t skip)

| Stage | Who installs | Build profile | Store listing |
|-------|----------------|---------------|---------------|
| **v1.0 App Store submit** | Apple / Google reviewers | `production` + submit | **App Store** + **Play Store** |

You are submitting **v1.0** to the public App Store. Use production reviewer notes in [store-review-test-accounts.md](./store-review-test-accounts.md) — **no** “closed beta” language in ASC notes.

---

## Accounts you need (one-time)

| Platform | Cost | URL |
|----------|------|-----|
| **Apple Developer Program** | $99/year | https://developer.apple.com/programs/ |
| **Google Play Console** | $25 one-time | https://play.google.com/console |
| **Expo / EAS** | Free tier OK for builds | https://expo.dev (already linked) |

Use the same Apple ID you used for EAS iOS credentials (`kunyupoon495@gmail.com` per handoff doc).

---

## Before any store submit — checklist

| Item | Rally status |
|------|----------------|
| App icon 1024×1024, no transparency (iOS) | `assets/branding/icon-1024.png` |
| Privacy policy URL (hosted) | Required for both stores — host on Notion/web |
| Support email / URL | App Store Connect + Play Console |
| Age rating questionnaire | Sports/social → typically 12+ |
| Screenshots (6.7", 6.5", iPad if tablet) | **After** designer v1.0 |
| App description + keywords | LA badminton/pickleball beta positioning |
| `eas env` for **production** | Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY` from preview; use **prod** Supabase when you split |
| Remove dev-only UI in prod | `APP_ENV=production` — verify no debug panels |
| Terms / waiver in app | Already in Profile → Legal |

---

## Build commands (EAS)

From `RallyApp/`:

```bash
# Closed beta / TestFlight candidate (store-signed)
npx eas-cli build --profile production --platform ios
npx eas-cli build --profile production --platform android

# Faster internal testing (not for public store)
npx eas-cli build --profile preview --platform ios
npx eas-cli build --profile preview --platform android
```

First time per platform: run credentials interactively ([eas-build-and-credentials.md](./eas-build-and-credentials.md)):

```bash
npx eas-cli credentials -p ios
npx eas-cli credentials -p android
```

---

## iOS — TestFlight → App Store

### A. Register the app (once)

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **+** New App.
2. Platform iOS, name **Rally**, bundle ID **`com.rallyapp`**, SKU e.g. `rally-ios-001`.
3. Primary language, category **Sports** (secondary **Social Networking** optional).

### B. Upload a build

```bash
cd RallyApp
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios --latest
```

Or download `.ipa` from expo.dev and upload with **Transporter** (Mac App Store).

### C. TestFlight (beta, no public listing)

1. App Store Connect → your app → **TestFlight**.
2. Wait for build processing (~5–30 min).
3. **Internal testing** — up to 100 team members (same App Store Connect org).
4. **External testing** — up to 10,000 testers; requires **Beta App Review** (lighter than full review).
5. Share public TestFlight link or add emails.

### D. Public App Store (v1.0)

1. Fill **App Privacy** nutrition labels (data linked to user: account, location, messages).
2. Upload screenshots + description + support URL + privacy policy URL.
3. **Pricing** → Free.
4. Create version **1.0.0** → select the uploaded build.
5. Submit for **App Review** (plan 24–48h+; sports/social may get questions on UGC moderation — point to report/admin flow).
6. Release manually or automatic after approval.

**Review tips for Rally:** Use the production paste in [store-review-test-accounts.md](./store-review-test-accounts.md). Mention LA pickup sports, user-generated chat, report/block flow, in-app delete account, and foreground-only location. Do **not** describe the app as a beta or TestFlight product in App Review Information notes.

---

## Android — Internal testing → Production

### A. Register the app (once)

1. [Play Console](https://play.google.com/console) → **Create app**.
2. Name **Rally**, default language, app/game type, declarations (ads: no if true).

### B. Upload a build

```bash
npx eas-cli build --profile production --platform android
npx eas-cli submit --platform android --latest
```

Play expects **AAB** (EAS production profile produces this). First upload may require **Play App Signing** — let Google manage signing (recommended).

### C. Internal testing track

1. Play Console → **Testing** → **Internal testing**.
2. Create release → upload AAB (or use `eas submit`).
3. Add tester emails (up to 100) → share opt-in link.

### D. Open / closed testing → Production

1. **Closed testing** — larger email list, still unlisted.
2. **Production** → create release, roll out countries (start US), **staged rollout** 5% → 100%.
3. **Data safety form** + content rating questionnaire (required before production).

---

## Environment: preview vs production

| Environment | Supabase | EAS profile | Use |
|-------------|----------|-------------|-----|
| Preview | `casljueycxsqexpkdiuq` (today) | `preview` | Daily beta |
| Production | Separate project recommended before public launch | `production` | Store builds |

```bash
eas env:create production --name SUPABASE_URL --value "https://....supabase.co" --visibility secret
eas env:create production --name SUPABASE_ANON_KEY --value "eyJ..." --visibility secret
```

Run migrations on prod Supabase before switching store builds.

---

## GitHub / branch workflow (your repo)

```text
dev     → feature work
preview → push triggers EAS preview Android CI (see github-actions-preview.md)
main    → production releases when ready
```

Before testers align: **merge `dev` → `preview`**, rebuild, reinstall on physical devices.

---

## Timeline suggestion (founder)

| When | Action |
|------|--------|
| **Now** | `production` build → TestFlight internal + Play internal; 5–10 LA hosts |
| **Designer done** | Screenshots + store copy |
| **Replay metric OK** | v1.0 submit — **manual release** (not auto on first submit) |
| **Post-approval** | Phased rollout; monitor Sentry/crash-free sessions |

---

## Costs (rough)

| Item | Estimate |
|------|----------|
| Apple Developer | $99/yr |
| Google Play | $25 once |
| EAS builds | Free tier often enough early; paid if many builds/month |
| Supabase | Free → Pro when traffic grows |

---

## What “publish” does **not** require yet

- Redis, separate API server, payments SDK  
- Public marketing until v1.0 gate  
- Full Guest (A2) or Teams/Leagues  

---

## Quick reference commands

```bash
cd /Users/kenpoon/Rally/RallyApp

# Store-ready binaries
npx eas-cli build --profile production --platform all

# Upload to stores (after accounts exist)
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest

# Check build status
npx eas-cli build:list --limit 5
```

Dashboard: https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds
