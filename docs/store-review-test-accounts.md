# Store review — test accounts & reviewer notes

**Last updated:** 2026-06-24  
**Canonical paste:** Use the blocks below for **every** App Store and Play Store resubmit.  
**Backend:** Production store builds use the Supabase project in EAS **`production`** env (today: `casljueycxsqexpkdiuq`). Re-seed demo data the **same day** you upload a build.

**Privacy policy:** https://kenpoon555.github.io/rally/privacy-policy  
**Support:** kunyupoon495@gmail.com

---

## Pre-submit checklist

Use before **any** Apple or Google submission:

| # | Check | Where |
|---|--------|--------|
| 1 | Demo login works on the **exact build** you are uploading | TestFlight or release build on device |
| 2 | `marcus@…` sees Inbox + Play content | Re-seed if empty (commands below) |
| 3 | Apple **App Review Information** has demo creds + **Notes** (production paste) | App Store Connect |
| 4 | Notes contain **no** “beta”, “TestFlight”, “closed beta”, or “founding member” | ASC + Play Console |
| 5 | Production binary is **Build 12+** (Guideline 2.2 fixes) | `app.json` / EAS |
| 6 | Delete account works (Profile → Settings → Legal) | Device smoke test |
| 7 | Location is **When In Use** only (no background GPS) | Already fixed Build 7+ |

---

## Primary reviewer account (Apple + Google)

| Field | Value |
|-------|--------|
| **Name** | `Rally demo host` |
| **Email / username** | `marcus@rally-mvrhoops.demo` |
| **Password** | `MonroviaHoops26!` |

**Login:** Welcome → **Log in** → email + password (no Sign in with Apple on the login screen).

**After login, reviewers should see:**

- **Today** / **Play** — LA-area pickup games
- **Inbox** — **Julian Fisher Park Regulars** Rally thread (if Monrovia seed applied)
- **Profile → Settings → Legal** — terms, waiver, privacy, delete account
- **Profile → Settings → Help** — send feedback (not “beta feedback”)

**Optional member account** (second reviewer path):

| Email | Password |
|-------|----------|
| `derek@rally-mvrhoops.demo` | `MonroviaHoops26!` |

---

## Apple — where to paste notes

App Review notes live in **App Store Connect**, not in this repo.

### A. Demo login + walkthrough notes (edit before submit)

| Step | Location |
|------|----------|
| 1 | [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **Rally LA** |
| 2 | Top tab → **Distribution** |
| 3 | Left sidebar → **iOS App** → click **1.0** (version row, not “App Information”) |
| 4 | Scroll to **App Review Information** |
| 5 | **Sign-in required** → **Yes** |
| 6 | **Username** → `marcus@rally-mvrhoops.demo` |
| 7 | **Password** → `MonroviaHoops26!` |
| 8 | **Notes** → paste block below |
| 9 | Attach new build → **Submit for Review** |

> **Not here:** **App Information** (name, bundle ID) and **App Review** (rejection thread) do **not** have the Notes field.

### B. Apple rejection reply (after a rejection)

Left sidebar → **General** → **App Review** (red badge) → **Reply** in the message thread.

Use when resubmitting Build 12 after Guideline 2.2:

```text
We addressed Guideline 2.2 in build 12:

- Removed in-app beta-testing surfaces (sport captain applications, manual concierge matching).
- Replaced limited-rollout copy on welcome, auth, onboarding, and Play empty states.
- Updated App Review Information notes to describe the production app (no beta/TestFlight language).

Demo account unchanged: marcus@rally-mvrhoops.demo / MonroviaHoops26!

Thank you for reviewing.
```

---

### Copy-paste — App Review Information → Notes

**Use this for every App Store resubmit (Build 12+).**

```text
Rally — pickup sports and recurring crews (Rallies) in Los Angeles.

SIGN-IN (required)
  Email: marcus@rally-mvrhoops.demo
  Password: MonroviaHoops26!

  Email/password only — no Sign in with Apple on the login screen.

AFTER LOGIN
  • Allow Location when prompted (When In Use — foreground only; no background tracking).
  • Optional: Notifications.

SUGGESTED REVIEW PATH
  1. Log in with credentials above.
  2. Inbox → open "Julian Fisher Park Regulars" (Rally chat) or a game thread.
  3. Play → browse games → tap a card for game detail and roster.
  4. Profile → Settings → Legal (terms, waiver, privacy).
  5. Profile → Settings → Delete account (in-app account deletion — Guideline 5.1.1(v)).

USER-GENERATED CONTENT
  • Users can chat in Rally and game threads.
  • DM or group chat: open Safety (header) → Report user or Block user.
  • Profile → Settings → Blocked users to manage blocks.
  • Terms require zero tolerance for objectionable content; signup includes community standards acceptance.

OPTIONAL SECOND ACCOUNT (crew member view)
  Email: derek@rally-mvrhoops.demo
  Password: MonroviaHoops26!

No payments in-app. Adults 18+ signup path in this build.

Support: kunyupoon495@gmail.com
Privacy: https://kenpoon555.github.io/rally/privacy-policy
```

### Do not use (caused Build 11 rejection)

```text
Rally LA — closed LA sports beta
Rally is a closed LA beta for pickup sports...
```

---

## Apple — TestFlight only (optional)

**TestFlight → External group → Test Information** is separate from App Store review. You may use the same demo account; avoid “closed beta” in external tester copy.

```text
Rally — pickup sports in Los Angeles.

Sign-in: marcus@rally-mvrhoops.demo / MonroviaHoops26!

Try: Inbox → Julian Fisher Park Regulars · Play → open a game · Profile → Settings.

Support: kunyupoon495@gmail.com
```

---

## Google Play — App access sign-in

**Play Console → Policy → App content → App access** → *All or some functionality is restricted* → **Add sign-in details**

| Field | Value |
|-------|--------|
| **Name** | `Rally demo host` |
| **Username, email, or phone** | `marcus@rally-mvrhoops.demo` |
| **Password** | `MonroviaHoops26!` |

### Any other information required for access

```text
Rally — pickup sports and recurring crews in Los Angeles.

Login: email + password only (no Google/Apple SSO on the login screen).

1. Open app → Log in on welcome screen.
2. Email: marcus@rally-mvrhoops.demo
   Password: MonroviaHoops26!
3. Accept terms if prompted; allow location When In Use (Play / map).
4. Tabs: Today, Play, Map, Inbox, Profile.

Demo data: host account has basketball Rally "Julian Fisher Park Regulars"
and sample LA games. If login fails, demo seed may need re-run on backend.

Account deletion: Profile → Settings → Legal → Delete account.

UGC: chat in Rallies/games; report and block via Safety in chat; blocked users in Profile → Settings.

No 2FA. No invite-only login gate. No special hardware.

Privacy: https://kenpoon555.github.io/rally/privacy-policy
Support: kunyupoon495@gmail.com
```

---

## Other demo accounts (internal QA only)

Same password for Monrovia demo users (`MonroviaHoops26!`):

| Email | Role | Username |
|-------|------|----------|
| `marcus@rally-mvrhoops.demo` | Rally host | `@marcus` |
| `derek@rally-mvrhoops.demo` | Crew member | `@derek` |
| `{username}@rally-mvrhoops.demo` | Member | `jordan`, `alex`, `casey`, … |

**Do not** put personal accounts or `@kunyu` passwords in store forms.

---

## Keep demo accounts working

If reviewers report **Invalid email or password**, re-seed the linked Supabase project **same day as upload**:

```bash
cd RallyApp

SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-monrovia-basketball-rally-demo.mjs
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql

# Optional: extra Discover fixtures
supabase db query --linked -f supabase/scripts/seed_beta_test_data.sql
```

### Invite landing pages (edge functions)

Share links for games/Rallies open `game-invite` / `rally-invite` web pages. **Get Rally on iPhone** now defaults to the **App Store** (`id6777569179`), not TestFlight.

```bash
cd RallyApp
supabase functions deploy game-invite rally-invite --yes
```

Optional override via secrets:

```bash
supabase secrets set IOS_INSTALL_URL="https://apps.apple.com/app/id6777569179" --project-ref casljueycxsqexpkdiuq
```

---

## Security notes

- Demo passwords are shared with Apple/Google reviewers only — rotate if abused.
- Never publish reviewer passwords on public websites or store listings.
- Founder emails are **not** for store review forms.

---

## Related docs

- [app-store-rejection-jun-2026.md](./app-store-rejection-jun-2026.md) — rejection history + Build 12 fixes
- [APP_STORE_PLAY_STORE_PREP.md](./APP_STORE_PLAY_STORE_PREP.md) — EAS build + listing checklist
- [contracts/module-production-surface.md](./contracts/module-production-surface.md) — Guideline 2.2 contract
- [contracts/module-ugc-moderation.md](./contracts/module-ugc-moderation.md) — Guideline 1.2 UGC proof
