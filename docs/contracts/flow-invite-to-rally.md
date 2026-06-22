# Flow A — Invite link → auth → Rally

**Contract id:** `flow-invite-to-rally`  
**Loop:** A (run before Loop B)  
**GTM 1:** Real-device rows required — see [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md)  
**Screens:** Deep link handler, Auth, Today (invite card), RegularsCrew (optional landing)  
**Related code:** `src/context/AuthContext.tsx`, `src/navigation/deepLinking.ts`, `src/pages/Home/DynamicHomeScreen.tsx`, `src/services/regularGroupService.ts`

## Purpose

A friend receives a Rally invite, installs or opens Rally, signs in, and ends up in the product with the invite accepted — no red screen, no dead end.

North-star slice: **tap link → install/open → auth → joined Rally visible somewhere in app.**

## Demo setup

**No public App Store required.** Use simulator (tier 1) or TestFlight / Play internal (tier 2). See [contracts/README.md](./README.md#testing-without-public-app-store).

1. Linked preview Supabase with Monrovia demo seeded:
   ```bash
   cd RallyApp
   node scripts/seed-monrovia-basketball-rally-demo.mjs
   supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
   ```
2. Host (`marcus@rally-mvrhoops.demo`) opens Rally hub → share **Rally invite link** (`rallyapp://group-invite/{token}`).
3. Tester uses a **fresh account** or `@kunyu` on a device/simulator that is **not** already in that Rally (sign out first if testing re-invite).

### Simulator deep link (iOS)

```bash
xcrun simctl openurl booted "rallyapp://group-invite/<TOKEN_FROM_DB>"
```

Replace token from `regular_groups.invite_token` for the demo group.

## Required states

| State | How to reach | Must show |
|-------|--------------|-----------|
| **Cold: not logged in + group invite** | Open `group-invite` URL while signed out | Sign-in prompt or auth screen — not a crash |
| **Auth return** | Complete magic link / login after invite | Session restored; app does not hang on splash |
| **Logged in + group invite** | Open `group-invite` URL while signed in | Success path: Rally chat **or** clear confirmation alert; user is a member |
| **Today: pending Rally invite** | Friend invite row (in-app, not URL) | `RallyInviteCard` on Today with Accept / Decline |
| **After accept** | Tap Accept on Today invite card | Navigates to Rally hub (`RegularsCrew`); member sees Chat tab |
| **Game invite (pickup)** | Open `rallyapp://invite/{activityInviteToken}` | Lands on `ActivityDetail` or redeem flow — no infinite loading |
| **Invalid / expired token** | Malformed UUID or unknown token | User-facing error — no redbox |
| **HTTPS universal link (device)** | Open `https://…` Rally invite with app installed | App opens and processes invite — not browser-only dead end |
| **No app installed (device)** | Same HTTPS link on device without app | Landing page with App Store / Play install CTA |
| **Post-install recovery (device)** | Install from store, then reopen same invite link | Pending invite completes — see [flow-auth-onboarding.md](./flow-auth-onboarding.md) |

## Pass/fail checklist

### Simulator (baseline / regression)

Use `rallyapp://` scheme and Monrovia seed — tier 1 in demo setup.

### Stability
- [ ] No React redbox or "Rendered more hooks" on any path above
- [ ] No permanent spinner (>10s) on invite redeem
- [ ] Metro bundle loads (no syntax error blocking app start)

### Auth + deep link (sim)
- [ ] Signed-out user tapping `group-invite` gets **Sign in required** (or auth flow) — not silent failure
- [ ] After login, pending invite replays without manual deep link again — [flow-auth-onboarding.md](./flow-auth-onboarding.md)
- [ ] `auth/callback` deep link sets session without crash

### Rally friend invite (Today card)
- [ ] Pending invite visible on **Today** when `listMyPendingRegularGroupInvites` returns rows
- [ ] **Accept** adds user to Rally and opens hub
- [ ] **Decline** removes card; user is not a member
- [ ] Accept/decline busy state disables double-tap

### Group URL invite (sim)
- [ ] Valid `group-invite` while logged in joins Rally (member row exists)
- [ ] User reaches **Chat** or sees **Joined crew** confirmation
- [ ] If next game is full, user still joins Rally with clear copy (not a crash)

### Game URL invite (`invite/` token)
- [ ] Resolves activity id and shows game detail **or** game room for approved joiner
- [ ] Invalid token shows alert — not a blank screen

### GTM 1 launch gate — real device (required for broad beta)

Test on **physical iPhone + Android** with store or TestFlight build — not sim-only.

- [ ] HTTPS universal / app link opens installed app to correct Rally or game
- [ ] Link without app shows install landing (App Store / Play) — not 404
- [ ] After install + reopen link, user joins correct Rally without founder help
- [ ] Signed-out tap stores pending invite; post-auth lands in correct destination
- [ ] Invalid/expired link shows user-facing error on device

### Performance
- [ ] Cold open to interactive auth or Today **< 3s** on simulator (reasonable; log if not)

## Screenshots required

Save to `docs/contracts/screenshots/flow-invite-to-rally/`:

1. `01-signed-out-group-invite.png` — alert or auth gate
2. `02-today-rally-invite-card.png` — pending invite on Today
3. `03-after-accept-rally-hub.png` — RegularsCrew Chat tab
4. `04-group-invite-url-success.png` — after opening valid group-invite URL logged in
5. `05-game-invite-detail.png` — pickup game invite landing (optional if Loop A focuses Rally only)
6. `06-device-https-invite-success.png` — real device: HTTPS link → joined Rally (GTM 1)
7. `07-device-install-landing.png` — real device: no app → store landing (GTM 1)

## Out of scope

- Play tab discover layout
- Push notification tap handling (separate contract)

**Simulator-only:** `rallyapp://` scheme tests do not satisfy GTM 1 device rows — run device section before broad beta.

**In scope for GTM 1:** HTTPS universal links, install landing, post-install invite recovery — see launch gate checklist above and [module-invite-link.md](./module-invite-link.md).

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | **Pickup P0:** Deep links reach native iOS but JS handler silent no-op — blocks L1 invite personas | Builder B1 |
| 2026-06-10 | Sim run: deep links reached native iOS but not JS on some paths — **re-verify on real device for GTM 1** | Fixer if device fails |
| 2026-06-10 | Native UIKit focus-engine crash on automated LoginScreen text entry — human retest | — |
| 2026-06-16 | Contract updated: GTM 1 device rows in scope; reconcile validator report vs device retest | Founder |

## Validator report template

> **Historical sim run** 2026-06-10 — see below. Re-run sim + **device** sections after fixes; do not treat as current green without device pass.

> Run: 2026-06-10 ~19:45–20:02 PT · iOS Simulator tier 1 · iPhone 17 Pro (iOS 26.4)

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Signed-out group invite | ⚠️ Partial | Auth/welcome gate is shown (no crash), but firing `group-invite` while signed out is a **silent no-op** — no "Sign in required" alert. Deep link reaches native but not JS. |
| 2 | Auth return | N/T | Not exercised. No email magic-link path on sim; demo host `marcus@rally-mvrhoops.demo` login rejected ("Invalid email or password" — likely seeded with custom `RALLY_DEMO_PASSWORD`). App does correctly show welcome (no splash hang) when no session. |
| 3 | Today invite accept | N/T | `@kunyu` is already a member of all 6 seeded token groups, so `listMyPendingRegularGroupInvites` returns no rows → no `RallyInviteCard` to accept. Not seedable without host-side invite. |
| 4 | Group URL join | ❌ Fail | Valid `group-invite` (Julian, `a1000001-…301`) opened while logged in → **no navigation to Rally chat and no confirmation alert**. Stayed on Today. Native log confirms `UIOpenURLAction` delivered to app; JS handler produced no effect. |
| 5 | Game invite landing | ❌ Fail | `invite/400a8e6b-…` opened warm, backgrounded, and cold → **never lands on `ActivityDetail`**, stays on Today. No redbox/blank, just no routing. |
| 6 | No redbox | ✅ Pass | No React redbox or "Rendered more hooks" on any path; app renders/navigates fine. (One *native* UIKit focus-engine crash — `_UIFocusGroupMap` / `UIFocusSystem updateFocusIfNeeded`, EXC_BREAKPOINT — reproduced only during automated text entry on LoginScreen; likely sim/automation focus artifact, see Open issues.) |

### Invalid token (contract required-state row 7)

| Item | Pass | Notes |
|------|------|-------|
| Invalid/expired token shows error, not redbox | ⚠️ Partial | `group-invite/00000000-…0000` → **no error alert** (silent no-op), but also no redbox/crash. Same root cause as rows 1/4/5 (URL not reaching JS handler). |

### Root cause hint (for Fixer)

Deep-link URLs **are** delivered to the native iOS scene — `xcrun simctl spawn booted log stream` shows `CoreSimulatorBridge: Opening URL (rallyapp://group-invite/…)` and `RallyApp … Received action(s) in scene-update: UIOpenURLAction`. But the `Linking` url-event in `AuthContext.handleAuthDeepLink` (`src/context/AuthContext.tsx`) never produces navigation or `Alert`. Suspects: (a) UIScene `scene:openURLContexts:` not bridged to `RCTLinkingManager` for warm/background opens; (b) cold start `Linking.getInitialURL()` resolving before `navigationRef.isReady()` so `navigate` is silently skipped (handler has no ready-retry). This single defect explains rows 1, 4, 5, and the invalid-token row.

### Screenshots saved (`docs/contracts/screenshots/flow-invite-to-rally/`)

- `01-signed-out-group-invite.png` — auth/welcome gate (signed out)
- `04-group-invite-url-success.png` — state after logged-in group-invite (still Today — no success screen)
- `05-game-invite-detail.png` — state after game invite (still Today — no detail screen)
- `06-invalid-token-noop.png` — state after invalid token (still Today — no alert)
- *Skipped:* `02-today-rally-invite-card.png`, `03-after-accept-rally-hub.png` — no pending invite seedable for `@kunyu` (see row 3).
