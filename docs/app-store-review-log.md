# App Store / Play review log — master list

**Purpose:** One canonical, chronological list of every Apple/Google review rejection so we can track what was raised, what we fixed, and what is still open. Add a row to the status table **and** a detail section for every new rejection.

**Related (deeper docs):**
- [app-store-rejection-jun-2026.md](./app-store-rejection-jun-2026.md) — fix plans for Build 6/11
- [store-review-test-accounts.md](./store-review-test-accounts.md) — demo creds + ASC notes + re-seed commands
- [contracts/module-production-surface.md](./contracts/module-production-surface.md) — Guideline 2.2 contract
- [contracts/module-ugc-moderation.md](./contracts/module-ugc-moderation.md) — Guideline 1.2 UGC

---

## Status table (newest first)

| Build | Date | Guideline | Issue (short) | Status |
|-------|------|-----------|---------------|--------|
| **1.0 (15)** | 2026-06-26 | **2.2** | "Still includes features intended to support beta testing" — Profile → "Send feedback / **Report bugs**" routed to a `BetaFeedback` screen | **FIXING** — branch `fix/app-store-build-16` |
| 1.0 (14) | 2026-06-25 | 2.2 | Populated demo + iPad + display name | Shipped (empty-app angle resolved); superseded by Build 15 |
| 1.0 (13) | 2026-06-25 | 2.2 | "Demonstrates a concept / not a complete experience" — empty app for reviewer | Fixed in Build 14 |
| 1.0 (11) | 2026-06-24 | 2.2 | Beta-testing UI (captain apply, concierge manual match, LA wedge, ASC notes) | Fixed in Build 12 (code on `dev`) |
| 1.0 (9) | 2026-06-22 | 2.2 | Beta UI in production (literal "Beta" badges) | Fixed in Build 10 (#63) |
| 1.0 (6) | 2026-06-17 | 2.5.4 | `UIBackgroundModes: location` with no background-GPS feature | Fixed Build 7 (Info.plist) |
| 1.0 (6) | 2026-06-17 | 2.1(a) | Demo account / empty app — Inbox empty, couldn't verify features | Partially fixed (seed); recurs in Build 13 |
| 1.0 (6) | 2026-06-17 | 5.1.1(v) | No in-app account deletion | Fixed Build 7 (migration 072 + Profile → Delete account) |

Legend: **OPEN** = needs work before next submit · Fixed = shipped & not re-flagged.

---

## 1.0 (15) — 2026-06-26 · Guideline 2.2 (beta-testing features) · FIXING (Build 16)

**Submission ID:** `1767d049-b7a0-440e-883d-5d95d329c5e9`
**Review device:** iPad Air 11-inch (M3) · **Version:** 1.0 (15)

### What Apple said

> Your app includes still features that are intended to support beta testing. Since you are submitting a production version of your app, features intended to support beta testing are not appropriate.

This is the **beta-testing-UI** flavor of 2.2 again (like Build 9/11), **not** the empty-app angle (Build 13, fixed in 14). Build 14's data/iPad work landed and that reason did not recur.

### Root cause (full scan, 2026-06-26)

**Primary — a "Report bugs" feedback surface named `BetaFeedback`.**

| Surface | What reviewer sees | Why it reads as beta |
|---------|-------------------|----------------------|
| **Profile → Settings → Help → "Send feedback"** | value text **"Report bugs or ideas"** | Routed to `ROUTES.FEEDBACK.BETA` → screen **`BetaFeedbackScreen`**; "report bugs" is a classic beta/QA affordance |
| Feedback screen hint | "Share **bugs**, confusing moments, or ideas." | "bugs" wording reinforces beta bug-reporting |

This was the **only** ungated, reviewer-visible beta-testing affordance left (Admin dashboard is `is_admin`-gated; demo accounts confirmed non-admin).

### Fix (Build 16) — on `fix/app-store-build-16`
- [x] Rename route `FEEDBACK.BETA → FEEDBACK.MAIN` (`'BetaFeedback' → 'Feedback'`); rename `BetaFeedbackScreen.tsx → FeedbackScreen.tsx` (component + param list).
- [x] Profile row value "Report bugs or ideas" → **"Questions or ideas"**.
- [x] `feedbackHint` drops "bugs" → neutral product-feedback wording.
- [x] Reworded internal comments ("closed beta", "2-sport closed beta") so no "beta-test" phrasing remains in shipped source.
- [x] `buildNumber` / `versionCode` → **16** (> reviewed 15).
- [x] **Automated guard:** `__tests__/noBetaSurfaces.test.ts` scans `src/` for beta-test signals (`report a bug`, `beta feedback`, `TestFlight`, `closed beta`, `founding member`, `early access`, …) and fails `npm test` (→ CI gate) if any reappear.
- [ ] EAS production build from `fix/app-store-build-16` → submit Build 16.
- [ ] Reply in ASC rejection thread (template in [store-review-test-accounts.md](./store-review-test-accounts.md)).

### Did we address Apple's previous question?
**Yes.** Build 13's empty-app reason did not recur after Build 14. Build 15 is a separate, specific beta-feature flag — the `BetaFeedback`/"report bugs" surface — now removed, with a regression guard so it cannot ship again.

---

## 1.0 (13) — 2026-06-25 · Guideline 2.2 (concept / incomplete experience) · Fixed in Build 14

**Submission ID:** `c5b8e615-5701-4cd5-a951-2d41b64805c1`
**Review device:** iPad Air 11-inch (M3) · **Version:** 1.0 (13)

### What Apple said

> Your app is designed to demonstrate the app concept to potential customers. Apps designed only to demonstrate, showcase, or upsell an app concept or service are not appropriate. … revise the app and metadata so that it is appropriate for public distribution and **provides users a complete experience**.

This is a **different sub-reason** from Build 9/11. Those were *beta-testing UI* (now fixed). Build 13 is the **"app feels empty / like a demo, not a finished product"** flavor of 2.2.

### Root cause (full scan, 2026-06-25)

**Primary — the reviewer saw a nearly empty app.** Confirmed by our own visual product review (2026-06-24) and a sim smoke test today with `marcus@rally-mvrhoops.demo`:

| Surface | What reviewer sees | Why |
|---------|-------------------|-----|
| **Play → Discover** | "No Basketball games nearby" (empty) | Seed's only upcoming game is `visibility: 'friends'` and hosted by marcus himself → nothing in the public nearby feed |
| **Today** | "No game scheduled yet" / a single card | Seed creates **4 past/completed** games + **1 upcoming** only |
| **Inbox** | All filters empty | No seeded threads visible to marcus at review time |
| **Profile** | "Display name" field shows `marcus@rally-mvrhoops.demo` | Demo account `display_name` == its `.demo` email → reads as a demonstration build |

Seed structure (`supabase/scripts/seed_monrovia_basketball_rally_demo.sql`): single host, single venue, single sport, 4 completed + 1 friends-only upcoming game. Even freshly re-seeded, **Discover is empty** and the app looks like a concept demo.

**Contributing factors**
- `app.json` `ios.supportsTablet: false`, but Apple reviewed on **iPad** → app runs scaled iPhone mode; empty + letterboxed reinforces "unfinished demo."
- Demo identity (`.demo` email visible in Profile).
- Content breadth is thin: one cohort, no cross-user public games.

### What is NOT the cause (already fixed — do not re-litigate)
- Beta-ops surfaces gated off: `BETA_OPS_SURFACES_ENABLED = false` (captain apply, concierge "match you manually", captain feedback) — `src/constants/betaFlags.ts`.
- Market/region wedge neutralized: `MARKET_COPY` clean, `playEmptyRegion: ''` — `src/constants/betaCopy.ts`.
- `BetaMarketBanner` / `MarketRegionCard` not mounted on any screen.
- `PLAY_PARTNER_SURFACES_ENABLED = false`.
- Build 12 fixes merged to `dev` (`03986f7`).

### Fix plan (Build 14) — implemented on `fix/app-store-build-14`

**A. Backend / data (highest leverage — must do before resubmit)**
- [x] `seed_store_review_demo.sql` — multiple **nearby** upcoming games across Basketball / Pickleball / Badminton from different hosts
- [x] Inbox threads — Rally crew chat, game room (marcus on Derek's game), friend DM with @derek
- [x] Demo `nickname` = human names (Marcus, Derek, …); SQL clears email-shaped nicknames
- [x] `./scripts/seed-store-review-demo.sh` — one-command re-seed same day as upload

**B. Binary**
- [x] `supportsTablet: true` (native iPad layout)
- [x] `profileDisplayName()` — Profile never shows raw email in display name field
- [x] Bump `buildNumber` / `versionCode` → **14**

**C. App Store Connect**
- [ ] Paste updated App Review notes (Build 14 path) — [store-review-test-accounts.md](./store-review-test-accounts.md)
- [ ] Reply in ASC rejection thread (Build 14 template in same doc)
- [ ] EAS production build from `fix/app-store-build-14`
- [ ] Re-run `./scripts/seed-store-review-demo.sh` **same day** as upload
- [ ] Submit for review

### Did we address Apple's previous question?
**Yes for Build 11's reason, no for Build 13's.** Build 12 correctly removed the beta-testing surfaces Apple cited in Build 11, and those fixes are on `dev`. Build 13 was rejected for a *new* angle — content completeness / empty-demo feel — which the Build 12 work did not target.

---

## 1.0 (11) — 2026-06-24 · Guideline 2.2 (beta-testing UI) · Fixed in Build 12

**Submission ID:** `c5b8e615-5701-4cd5-a951-2d41b64805c1`
Beta-testing surfaces in production: sport-captain apply, concierge "we will match you manually," LA-only sport wedge, and ASC notes calling it a "closed LA sports beta."
**Fix (Build 12, on `dev`):** `BETA_OPS_SURFACES_ENABLED=false`, full sport set on auth/onboarding, neutral `MARKET_COPY`, ASC notes rewritten (no "beta"/"TestFlight"). Detail: [app-store-rejection-jun-2026.md](./app-store-rejection-jun-2026.md).

---

## 1.0 (9) — 2026-06-22 · Guideline 2.2 (beta UI) · Fixed in Build 10

Literal "Beta" badges on Welcome, Profile → Settings, Feedback. Removed in PR #63 (`0681d97`).

---

## 1.0 (6) — 2026-06-17 · Fixed (3 issues in one resubmit)

**Submission ID:** `6b9effbb-be23-4cf0-b78e-100fced6d0bd`

- **2.5.4 — Background location:** `UIBackgroundModes: location` with no background-GPS feature → removed `location` mode + `NSLocationAlways*`; foreground "When In Use" only.
- **2.1(a) — Demo account / empty app:** reviewer couldn't verify features (Inbox empty); creds were only in TestFlight → put creds in ASC App Review Information + re-seed demo data. *(Note: the empty-app half resurfaced as Build 13's 2.2.)*
- **5.1.1(v) — Account deletion:** no in-app deletion → added Profile → Settings → Legal → Delete account (double confirm), RPC `delete_own_account()` (migration `072`).

Detail + checklists: [app-store-rejection-jun-2026.md](./app-store-rejection-jun-2026.md).

---

## Recurring pre-submit checklist (run every time)

| # | Check | Guideline |
|---|-------|-----------|
| 1 | Demo login works on the **exact build** uploaded | 2.1(a) |
| 2 | Play → Discover, Today, **and** Inbox are **populated** for the demo account (not empty) | 2.2 / 2.1(a) |
| 3 | Demo seed re-run **same day** as upload; upcoming **public** games exist | 2.2 |
| 4 | No `.demo`/email shown as a display name in UI | 2.2 |
| 5 | No "beta"/"TestFlight"/"closed beta"/"founding member" in app or ASC notes | 2.2 |
| 6 | Beta-ops surfaces gated off (`BETA_OPS_SURFACES_ENABLED=false`) | 2.2 |
| 7 | In-app Delete account works (Profile → Settings → Legal) | 5.1.1(v) |
| 8 | Location is When-In-Use only (no background GPS) | 2.5.4 |
| 9 | `buildNumber` / `versionCode` bumped | — |
| 10 | ASC App Review Information has demo creds + production notes | 2.1(a) |
