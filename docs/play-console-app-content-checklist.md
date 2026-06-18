# Google Play — App content checklist (Rally)

**Last updated:** 2026-06-13  
**Package:** `app.rally.sports`  
**Privacy policy:** https://kenpoon555.github.io/rally/privacy-policy  
**Delete account URL:** https://kenpoon555.github.io/rally/delete-account  
**Reviewer login:** [store-review-test-accounts.md](./store-review-test-accounts.md)

---

## CLI vs browser

| Item | CLI/API? | How |
|------|----------|-----|
| **Tracks / releases** (internal, closed) | ✅ Yes | EAS submit + `node scripts/play-console-api-status.mjs` |
| **Store listing text** | ✅ Partial | Play Publishing API / Play Console |
| **Privacy policy URL** | ❌ Browser | Play Console → App content |
| **Sign-in details** | ❌ Browser | Done ✅ |
| **Ads / Content rating** | ❌ Browser | Done ✅ |
| **Target audience** | ❌ Browser | **Next** — answers below |
| **Data safety** | ⚠️ CSV API possible | Easiest in browser first time |
| **Government / Financial / Health** | ❌ Browser | Quick No answers below |
| **Category + contact** | ❌ Browser | Sports + email below |
| **Store listing (screenshots)** | ❌ Browser | Upload PNGs in Console |

Google has **no API** for Target audience, App access, or most policy attestations — only the web Console (or exporting/importing Data safety CSV for advanced automation).

---

## Your progress (4 / 11 done)

| Status | Item |
|--------|------|
| ✅ | Privacy policy |
| ✅ | Sign-in details |
| ✅ | Ads |
| ✅ | Content rating |
| ⬜ | **Target audience** ← do this next |
| ⬜ | Data safety |
| ⬜ | Government apps |
| ⬜ | Financial features |
| ⬜ | Health |
| ⬜ | App category + contact |
| ⬜ | Store listing (screenshots) |

---

## 5. Target audience (do next)

**Play Console → App content → Target audience and content → Start**

| Question | Rally answer |
|----------|--------------|
| **Target age** | **18 and over only** (simplest for beta — social app with chat + location; avoids Families policy) |
| **Appeal to children?** | **No** |
| **Ads to children?** | N/A (no ads in app) |
| **Store presence for children** | **No** |

Save → continue through any follow-up questions honestly (sports coordination, user-generated chat, location for Discover).

---

## 6. Data safety

**Play Console → App content → Data safety → Start**

Align with [privacy policy](https://kenpoon555.github.io/rally/privacy-policy).

### Collects / shares

| Data type | Collected? | Shared? | Purpose |
|-----------|------------|---------|---------|
| **Email address** | Yes | No (except processors) | Account |
| **Name / username** | Yes | No | Profile |
| **Precise location** | Yes (optional permission) | No | Discover, map, nearby games |
| **Photos** | Optional (profile) | No | Profile |
| **Messages (chat)** | Yes | No | In-app chat |
| **App interactions** | Yes | No | Games, Rallies, roster |
| **Device or other IDs** | Yes (push token) | No | Notifications |
| **Crash logs** | Optional (Sentry if enabled) | With Sentry | Diagnostics |

### Practices

| Question | Answer |
|----------|--------|
| Data encrypted in transit | **Yes** (HTTPS) |
| Users can request deletion | **Yes** — https://kenpoon555.github.io/rally/delete-account |
| Delete account URL (Play form) | https://kenpoon555.github.io/rally/delete-account |
| Data sold | **No** |
| Independent security review | **No** (beta) |

Processors: **Supabase**, **Firebase/Google** (push), optional **Sentry**.

Submit when preview matches your privacy policy.

---

## 7–9. Government / Financial / Health

| Form | Answer |
|------|--------|
| **Government apps** | **No** — not a government app |
| **Financial features** | **No** — no banking, loans, crypto, or in-app purchases |
| **Health apps** | **No** — fitness/sports coordination only; not a medical or health-tracking app |

---

## 10. App category and contact details

| Field | Value |
|-------|--------|
| **Category** | **Sports** |
| **Tags** | Sports, Social (optional) |
| **Email** | kunyupoon495@gmail.com |
| **Phone** | Leave blank or your support number |
| **Website** | https://kenpoon555.github.io/rally/ (optional) |

---

## 11. Store listing

**Play Console → Grow → Store presence → Main store listing**

Text may already exist (API shows title **Rally**). Still required:

| Asset | Status |
|-------|--------|
| **Short description** (80 chars) | `Find pickup sports games and crews near you. LA beta.` |
| **Full description** | Expand current text — Rallies, Discover, chat, badminton/pickleball/basketball |
| **App icon** (512×512) | `assets/branding/store-listings/play/icon-512.png` |
| **Feature graphic** (1024×500) | `assets/branding/store-listings/play/feature-graphic-1024x500.png` |
| **Phone screenshots** (1080×1920, min 2) | `assets/branding/store-listings/play/phone/01–04*.png` |
| **7" / 10" tablet** (optional) | `play/tablet-7-inch/`, `play/tablet-10-inch/` |

Regenerate all listing assets:

```bash
python3 scripts/generate-store-listing-assets.py
```

See [assets/branding/store-listings/README.md](../assets/branding/store-listings/README.md) for iOS sizes too.

---

## Closed testing (after checklist)

When dashboard shows required items complete:

1. **Testing → Closed testing** → countries → testers → **Create release** → add **version code 6**
2. Roll out → submit for review if prompted
3. Copy **closed testing opt-in link** → update Supabase `ANDROID_INSTALL_URL` if using invite landing

---

## CLI status check

```bash
cd RallyApp
npm install googleapis   # one-time, if not installed
node scripts/play-console-api-status.mjs
```

Example output (2026-06-13):

```text
internal: versionCodes=6 status=completed
alpha (closed): versionCodes=6 status=draft   ← finish closed rollout in Console
```

---

## Related

- [store-review-test-accounts.md](./store-review-test-accounts.md)
- [beta-testflight-play-internal.md](./beta-testflight-play-internal.md)
- [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md)
