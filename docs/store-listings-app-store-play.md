# Store listings — App Store + Google Play (Rally v1)

Last updated: 2026-05-06

Use this as a **working checklist** before **public** listing. Replace bracketed placeholders with your production URLs and legal text after counsel review.

## Shared preparation

- [ ] **App name + subtitle** (30 / 30 chars on Apple; short description on Google).
- [ ] **Support URL** — e.g. `https://[your-domain]/support`
- [ ] **Marketing URL** (optional)
- [ ] **Privacy policy URL** — must match in-app behavior (location, account, chat). Start from [privacy-policy-DRAFT-template.md](privacy-policy-DRAFT-template.md) and publish at `https://[your-domain]/privacy`
- [ ] **Screenshots** — `assets/branding/store-listings/` (see README there). **iOS:** upload `ios/iphone-6.9-inch/` (1320×2868, min 2). **Play:** upload `play/phone/` (1080×1920, min 2). Rally is iPhone-only — no iPad required.
- [ ] **Feature graphic** (Play) + **Promotional text** (optional).
- [ ] **Content rating** questionnaires (both stores).
- [ ] **Data safety form** (Play) + **App Privacy** labels (Apple) — align with actual collection: account email, profile, **precise location**, messages (chat), device tokens (push).

## Apple App Store

- [ ] **Bundle ID** `com.rallyapp` matches Xcode / `app.json`.
- [ ] **Age rating** complete (social discovery / chat may affect rating).
- [ ] **Sign in with Apple** — if you only use email/password from Supabase, declare login types accurately.
- [ ] **Export compliance** / encryption questionnaire (standard HTTPS-only often exempt).
- [ ] **Review notes** — test account credentials for reviewers; explain location usage briefly. → **[store-review-test-accounts.md](./store-review-test-accounts.md)**

## Google Play

- [ ] **Data safety**: location, personal info, messages, optional photos.
- [ ] **Target API** level meets Play requirements (upgrade RN/Gradle as needed per AGP release notes).
- [ ] **Store listing** default language + at least one locale.

## Submission commands (EAS)

```bash
cd RallyApp
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

Staged rollout: Play Console **staged release %**; App Store **phased release**.

## After approval

- [ ] Monitor Sentry (if enabled) and Supabase logs for spikes.
- [ ] Hotfix pipeline: bump `version` / build numbers per store rules; rebuild with EAS.
