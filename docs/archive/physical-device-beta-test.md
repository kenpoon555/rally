# Physical device beta test guide

Last updated: 2026-06-01

Run on **real iPhone + real Android** in **Los Angeles** before widening TestFlight / Play internal testers.

## 0. Seed LA courts (Supabase)

```bash
cd RallyApp
node scripts/seed-la-courts.mjs
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Re-run is safe (skips existing rows).

## 1. Get the build

### Option A — EAS preview (recommended)

Preview builds deploy when `preview` branch updates (see `docs/github-actions-preview.md`).

1. Merge PR **dev → preview** (or wait for CI).
2. Open [Expo builds](https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds).
3. Install **iOS** (TestFlight or ad hoc) and **Android** APK on two phones.

### Option B — Local dev client

```bash
cd RallyApp
npm install
# Terminal 1
npm start
# Terminal 2 — Android USB
adb reverse tcp:8081 tcp:8081
npm run android
# iOS
npm run ios
```

Use `.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` matching project `casljueycxsqexpkdiuq`.

## 2. Environment checklist

- [ ] Location permission **While Using** on both devices
- [ ] Notifications allowed (Android 13+; iOS Settings → RallyApp)
- [ ] Two test accounts (e.g. host + guest)
- [ ] Same metro network if using dev client

## 3. Core loop (~15 min)

Uses [smoke-test-join-pickleball.md](./smoke-test-join-pickleball.md) with tab updates:

| Step | Who | Action |
|------|-----|--------|
| 1 | A | Discover → **Create Game** → court → publish |
| 2 | B | Discover → **Request to Join** |
| 3 | A | Activity detail → **Approve** |
| 4 | Both | **Chats** → game → Game Room → send message |
| 5 | Both | **Mark Ready** → A **Finalize roster** |
| 6 | B | Confirm push or in-app alert on approve/finalize |

**My Games** tab (not Profile) lists upcoming games.

## 4. Stage 3 features (~20 min)

| Feature | How to test |
|---------|-------------|
| **Tonight urgency** | Create with “Need players tonight” → badge on Discover |
| **Invite link** | Host **Share invite link** → B opens link cold |
| **Recurring** | **Make weekly recurring** → **Schedule next game** |
| **RSVP** | On a **Regulars or recurring** game only — B taps Going / Maybe (hidden on one-off Discover games) |
| **Post-game chat** | After play time, chat still open; archives after 72h |
| **Map (hidden)** | No Map tab or screen; court picker on **Create Game** uses the inline map only |

Badminton-specific: [smoke-test-badminton-invite-loop.md](./smoke-test-badminton-invite-loop.md)

## 4.5 Stage 3.5c redesign (~15 min)

| Feature | How to test |
|---------|-------------|
| **Details as modal sheet** | From a Game Room, tap **Details** → Activity Details slides up as a sheet; swipe down returns to the Game Room |
| **Invite → Game Room** | B opens a game invite link → after joining an open game, lands directly in the Game Room (not Details) |
| **Regulars group** | Host (A) on Details → **Save as Regulars group**; group appears as a row in A's **Chats** inbox |
| **Unified crew invite** | A → **Share crew + next game link**; B opens it cold → joins the crew **and** the next game, landing in the Game Room |
| **Mode-aware Chats** | A (with an active game) sees a **Next up** card on Chats; a brand-new account sees the Find/Create empty state |
| **Group name in Game Room** | Open a Regulars game's Game Room → header shows the **crew name** first, court + time secondary |
| **Find players** | Host opens a game with open spots → Game Room footer shows **Find players (N spots open)** → routes to Discover filtered by sport |
| **Badminton onboarding** | First host create → invite **share sheet opens automatically** after publish; **Need players tonight** toggle is visible (not buried); coach marks appear on Details |

## 5. Known limitations

- **iOS Simulator:** no FCM token — use physical iPhone for push QA
- **Discover empty:** run `node scripts/seed-la-courts.mjs`; on emulator set mock location to LA (e.g. Downtown 34.05, -118.24)
- **Stale UI:** pull to refresh; kill and reopen app if Realtime lag

## 6. Sign-off

Log pass/fail in `docs/phase-3-validation-results.md` and `docs/release-readiness-checklist.md`.
