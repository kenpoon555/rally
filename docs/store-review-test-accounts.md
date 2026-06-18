# Store review — test accounts (Apple + Google Play)

**Last updated:** 2026-06-13  
**Backend:** Production store builds use the Supabase project configured in EAS **`production`** env (today: preview project `casljueycxsqexpkdiuq`). Demo accounts must exist in that database.

**Privacy policy (public):** https://kenpoon555.github.io/rally/privacy-policy

---

## Primary reviewer account (use for both stores)

Use this for **Google Play → App content → App access → Sign-in required** and for **Apple TestFlight / App Review** notes.

| Field | Value |
|-------|--------|
| **Name** | `Rally demo host` |
| **Email / username** | `marcus@rally-mvrhoops.demo` |
| **Password** | `MonroviaHoops26!` |

**Login:** Welcome → **Log in** → email + password (Supabase email/password — no Sign in with Apple).

**After login, reviewers should see:**

- **Today** / **Play** tabs with LA-area games
- **Inbox** → **Julian Fisher Park Regulars** Rally (basketball crew) if Monrovia seed is applied
- **Discover** — public pickup games
- **Profile** → Legal (terms, waiver, location privacy)

---

## Apple — what we submitted

**TestFlight external (`rally_external`, build 6):** Beta App Review uses the same demo host account above unless you changed it in App Store Connect.

| Where in ASC | What to enter / verify |
|--------------|------------------------|
| **TestFlight → External group → build → Test Information** | “What to Test” + sign-in notes (below) |
| **App → App Information → App Review Information** | Same username/password when you submit **public App Store** later |
| **Contact** | `kunyupoon495@gmail.com` |

### Copy-paste — Apple “Notes for reviewer” / What to Test

```text
Rally is a closed LA beta for pickup sports and recurring crews (Rallies).

Sign-in (required):
  Email: marcus@rally-mvrhoops.demo
  Password: MonroviaHoops26!

After login, allow Location when prompted (Discover / map). Optional: Notifications.

Suggested path:
  1. Log in with credentials above
  2. Open Inbox → tap a Rally or game row
  3. Play tab → browse games; tap a card for detail
  4. Profile → Legal for terms and location privacy

UGC: users can chat and report issues; hosts can lock rosters. No payments in-app.

Support: kunyupoon495@gmail.com
Privacy: https://kenpoon555.github.io/rally/privacy-policy
```

---

## Google Play — App access sign-in form

**Play Console → Policy → App content → App access** → *All or some functionality is restricted* → **Add sign-in details**

| Field | Value |
|-------|--------|
| **Name** | `Rally demo host` |
| **Username, email, or phone** | `marcus@rally-mvrhoops.demo` |
| **Password** | `MonroviaHoops26!` |

### Any other information required for access

```text
Rally uses email + password login only (no Google/Apple SSO on the login screen).

1. Open the app → tap Log in on the welcome screen.
2. Enter the email and password above.
3. Accept terms if prompted; tap Allow for location (needed for Discover).
4. Main tabs: Today, Play (Discover), Map, Inbox, Profile.

Demo data: host account is seeded with a basketball Rally "Julian Fisher Park Regulars"
and sample games in the Los Angeles area. If login fails, demo seed may need to be
re-run on the backend (see "Keep demo accounts working" below).

No 2FA, no invite-only gate for login, no special hardware.

Privacy policy: https://kenpoon555.github.io/rally/privacy-policy
Support: kunyupoon495@gmail.com
```

---

## Other demo accounts (optional)

Same password for all Monrovia demo users (`MonroviaHoops26!`, or `RALLY_DEMO_PASSWORD` if set when seeding):

| Email | Role | Username |
|-------|------|----------|
| `marcus@rally-mvrhoops.demo` | Rally host | `@marcus` |
| `derek@rally-mvrhoops.demo` | Crew member | `@derek` |
| … | … | `jordan`, `alex`, `casey`, `riley`, `devin`, `taylor`, `morgan`, `chris` |

Pattern: `{username}@rally-mvrhoops.demo`

**Member-style testing (already in a Rally):** real profile `@kunyu` exists after beta seed — use only on devices you control; **do not** put personal passwords in store forms.

---

## Keep demo accounts working

If reviewers report **Invalid email or password**, re-seed the linked Supabase project:

```bash
cd RallyApp

# Auth users + Julian Fisher Park Rally demo
SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-monrovia-basketball-rally-demo.mjs
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql

# Optional: broader beta fixtures (@kunyu friends, Discover games)
supabase db query --linked -f supabase/scripts/seed_beta_test_data.sql
```

Default demo password is set in `scripts/seed-monrovia-basketball-rally-demo.mjs` (`RALLY_DEMO_PASSWORD` or `MonroviaHoops26!`).

---

## Security notes

- Demo passwords are **intentionally shared** with Apple/Google reviewers only — rotate if abused.
- **Never** publish reviewer passwords on GitHub Pages or public store listings.
- Real founder accounts (`kunyupoon495@gmail.com`, etc.) are **not** for store review forms.

---

## Related docs

- [beta-testflight-play-internal.md](./beta-testflight-play-internal.md) — TestFlight + Play tracks
- [contracts/README.md](./contracts/README.md) — `@kunyu` + `marcus@…` for QA loops
- [store-listings-app-store-play.md](./store-listings-app-store-play.md) — listing checklist
