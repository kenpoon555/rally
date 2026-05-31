# Physical device beta test guide

Last updated: 2026-06-01

Run on **real iPhone + real Android** before widening TestFlight / Play internal testers.

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
| **RSVP** | B taps Going / Maybe on activity detail |
| **Post-game chat** | After play time, chat still open; archives after 72h |
| **Map (deferred)** | Discover → **Browse nearby courts on map** (not a tab) |

Badminton-specific: [smoke-test-badminton-invite-loop.md](./smoke-test-badminton-invite-loop.md)

## 5. Known limitations

- **iOS Simulator:** no FCM token — use physical iPhone for push QA
- **Discover empty:** widen dev radius or seed courts; set mock location near LA courts on emulator
- **Stale UI:** pull to refresh; kill and reopen app if Realtime lag

## 6. Sign-off

Log pass/fail in `docs/phase-3-validation-results.md` and `docs/release-readiness-checklist.md`.
