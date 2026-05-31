# RallyApp Roadmap

Last updated: 2026-06-01

## Product Direction

- Rally helps users find sport partners quickly with less friction.
- The app encourages a healthier lifestyle through consistent activity and stronger social trust loops.
- Core success metric for MVP: a user can discover, join, and play with a partner in minutes.
- Next success metric: a group can converge on the best time/location with minimal coordination overhead.
- **UX north star (2026-05-31):** **Chat-first coordination** — users live in game lobbies; Discover is for filling empty slots.

## Tab structure (current — 6 tabs)

| Order | Tab | Role | Verdict |
|-------|-----|------|---------|
| 1 | **Chats** | Primary hub — game lobbies + friend DMs | ✅ Correct default |
| 2 | **My Games** | Upcoming / Past / Hosting roster view | ✅ Fits Stage 3 retention |
| 3 | **Discover** | Find open games to join (not already in) | ✅ Supply acquisition |
| 4 | **Map** | Courts browse (stack screen from Discover) | ✅ **Deferred off tab bar** (Stage 3.5a) |
| 5 | **Friends** | Social graph + DMs entry | ✅ Keep |
| 6 | **Profile** | Identity, trust, settings, reviews | ✅ Keep (lighter without My Games list) |

**Map deferral (Stage 3.5a — shipped):** Map removed from tab bar; open via Discover → “Browse nearby courts on map”. See `docs/stage-3.5-beta-polish-and-regulars.md`.

## Current Status (honest snapshot)

### Shipped and usable on device (with Metro reload / preview build)

| Area | What works |
|------|------------|
| **Auth** | Signup, login, profile auto-create, session refresh |
| **Discover** | Sport filter (pickleball / basketball / badminton), hide joined/finalized/invite-only, tonight boost |
| **Map** | Activity + court pins, Start Here → create — **candidate to hide from tab bar** |
| **My Games** | Upcoming / Past / Hosting tab (Stage 3) |
| **Friends** | Add, accept, search, 1:1 chat entry |
| **Chats tab** | Game lobbies + friend DMs in one inbox; **Details** → activity screen |
| **Create game** | Fixed time + court; flex path exists but de-emphasized in MVP |
| **Activity detail** | Join / approve / reject, Ready, Finalize, lobby chat, extend start |
| **Stage 2.5** | Finalize, Ready, leave, flake score, 72h post-game chat grace |
| **Stage 3 (partial)** | Recurring series, invite links, RSVP, tonight urgency, schedule next game |
| **Push (partial)** | Join, approval, **finalize** — physical device + token required; iOS Simulator = no push |

### Known gaps (QA found, not fully closed)

- **Push:** iOS Simulator never gets tokens; host on sim + player on Android = asymmetric notifications. Use **in-app Realtime alerts** or physical devices for QA.
- **Discover card state:** join status now loaded from DB (fixed 2026-05-31); still refresh on Realtime lag if app stale.
- **Participant avatars on Discover:** RLS hides other players until confirmed — shows count, not faces (by design).
- **Phase 3 checklist:** 2-account E2E not signed off in `phase-3-validation-results.md`.
- **Finalize sync:** Realtime + in-app alert + push RPC shipped; device QA still uneven on simulators.
- **Dev-only noise:** Discover pipeline panel, location debug (opt-in) — remove or gate before public beta.

### Infra migrations recently applied (Supabase `casljueycxsqexpkdiuq`)

- `016` — fix game chat SQL (`conversation_id` ambiguous)
- `017` — enable Realtime publication for chat + activities

## Decision Lock (2026-02-22)

- Activity creation default moves to **flexible optimization**:
  - Host provides broad constraints (time window, duration, candidate locations).
  - Players submit preferences.
  - System finalizes best time and location.
- Identity model is **anonymous until confirmed**:
  - Before confirmation: users see anonymized participant identity.
  - After confirmation: identities unlock for confirmed participants.

## Pickleball MVP (2026-05-28)

- **Launch sports:** **Pickleball, Basketball, Badminton** (`launchEnabled` in `src/constants/sports.ts`).
- **Default path:** **`fastFixed`** — set court + time now; join open games from Discover.
- **Secondary path:** **flexible matching** — “I'm flexible on time” on Create Game; uses preference collection + finalize RPC (`partnerFlex` behavior).
- **Phase 2+:** Re-enable additional sports via `launchEnabled` when expanding beyond pickleball wedge.
- **Chat scope:** Pre-game **lobby chat** for host + approved players; roster syncs until host finalizes (Stage 2.5). Post-finalize = locked roster. See `docs/chat-mvp-boundary.md`.
- **Parallel execution:** `docs/agent-workstreams-sport-matching.md`.

## What To Expect In App Right Now

### Tab 1 — Chats (default)

- **All | Games | Friends** — game rows → Game Room; friend rows → DM.
- Empty state CTAs: Find a game / Create game.

### Tab 2 — My Games

- **Upcoming | Past | Hosting** — tap → activity detail.

### Tab 3 — Discover

- Sport filter; open games only; **TONIGHT** badge for urgent hosts.
- Join → pending → approved; host sees **YOUR GAME**.

### Tab 4 — Map (defer for beta)

- Same pins as Discover + court spots; consider hiding until map-native UX exists.

### Tab 5 — Friends

- List, requests, search; message opens DM.

### Tab 6 — Profile

- Default sport, trust stats, reviews, settings, quiet hours (My Games → tab).

### Activity detail (secondary to chat)

- Host: approve requests, Ready gate, Finalize, extend, chat.
- Player: request join, Mark Ready, chat after approved.

## UX Redesign Backlog (recommended — not all built)

Priority order based on device QA:

1. [x] **Chat-first default** — Chats tab first on launch.
2. [x] **Single game timeline** — Game Room: chat + roster + Ready/Finalize in one screen.
3. [x] **Notification clarity** — In-app Realtime alerts; push on join/approve/finalize (devices).
4. [x] **Discover role** — Hide joined/finalized/invite-only from feed.
5. [x] **Empty states** — Chats + My Games CTAs.
6. [ ] **Remove dev diagnostics** from production builds (pipeline panel, debugger warnings).
7. [ ] **Hide Map tab** until map adds value beyond Discover — **done (3.5a)**; optional: in-app host coach marks (3.5b).

See `../open_items.md` for business stages 3–7 (recurring, teams, leagues).

## Master Plan

### Phase 1 - Stability and Auth Baseline

- [x] Verify signup/login/logout on iOS and Android end-to-end (run `docs/archive/auth-profile-validation-checklist.md`).
- [x] Validate profile auto-create behavior from authenticated session (Case 2 in checklist).
- [x] Remove noisy debug instrumentation from `src/services/userService.ts`.
- [x] Fix and align setup docs (`profiles` table naming and current flow).

### Phase 2 - Home Tabs MVP (Make Screens Useful)

- [x] Build `Discover` tab data fetch + loading + empty states.
- [x] Build `Map` tab activity pins + location fallback + empty states.
- [x] Build `Friends` tab list + friend requests + empty states.
- [x] Add clear onboarding hints for first-time users.
- [x] Ensure each tab has at least one primary CTA.
- [x] **Chats tab** — game lobbies + friend inbox (2026-05-31).

### Phase 3 - Core Partner Matching Flows

- [ ] Validate geolocation permissions and geofence detection (Case 1-2 in `docs/phase-3-partner-matching-validation-checklist.md`).
- [ ] Validate activity creation and listing in nearby feed (Case 3 in checklist).
- [ ] Validate join-request flow between two accounts (Case 4 in checklist).
- [ ] Validate friends request/accept flow (Case 5 in checklist).
- [x] Add `Quick Match` action (find partner by sport + time + distance).
- [ ] **Sign off** `docs/smoke-test-join-pickleball.md` on two physical devices.

### Phase 4 - Notifications

- [x] Firebase config files (iOS + Android).
- [x] Token registration, foreground/background handlers, `send-push` on join + approval.
- [x] Supabase `FIREBASE_SERVER_KEY` secret.
- [x] In-app Realtime alerts (join request, approval, finalize) — supplement push on simulators.
- [x] Push on finalize (RPC + edge function; device QA pending).
- [ ] Device QA Cases 1–5 — deferred to [post-preview-testing-backlog.md](docs/post-preview-testing-backlog.md).

### Phase 5 - Hardening and Release Readiness

- [x] Add integration test checklist for auth + profile lifecycle (`docs/archive/auth-profile-validation-checklist.md`).
- [x] Add production-safe key/config strategy (remove hardcoded secrets).
- [x] Improve error surfaces for auth/profile failures.
- [ ] Run regression pass on iOS and Android.
- [ ] Strip `__DEV__` discover diagnostics before TestFlight.

### Phase 6 - Flexible Match Optimization (V2.1)

- [x] Add flexible activity mode with host constraints (time window, duration, candidate locations).
- [x] Add participant preference submission flow and finalization RPC scoring.
- [x] Update Discover/Activity detail surfaces to show `collecting` and `finalized` states.
- [x] Add deterministic finalization validation checklist and sign-off.

### Phase 7 - Trust Layer: Reviews + Identity Privacy (V2.1)

- [x] Add post-match review system with one-review-per-pair-per-activity guard.
- [x] Add score threshold visibility (`>= 5` reviews before public aggregate score).
- [x] Enforce anonymous-until-confirmed rules in query layer and RLS.
- [ ] Add abuse controls (cooldown/edit window/report path).

### Phase 8 - Profile + Preference Center (V2.1)

- [x] Add profile section with picture, nickname, and default play preferences.
- [x] Add home profile icon entry and preference summary card.
- [x] Prefill activity creation from saved defaults.
- [x] Prompt users when selected activity differs from saved preference profile.

### Phase 9 - Chat Foundation (V2.1)

- [x] Game lobby chat via `ensure_activity_group_conversation` (host + approved players; migration `012`).
- [x] Auto-sync roster on join approve; host lobby opens at create.
- [x] Add friend 1:1 chat threads from Friends tab.
- [x] Add unread badges and realtime delivery (migration `017` + optimistic send).
- [x] **Chats tab** inbox with Games / Friends filters.
- [ ] Add chat moderation baseline (block/report in thread — partial via Safety sheet).
- [x] **Stage 2.5:** finalize, ready, leave, flake score, 72h chat grace — `docs/stage-2.5-game-commitment.md`
- [x] **Stage 3 (partial):** recurring, invite links, RSVP, My Games tab, tonight urgency — `docs/stage-3-organizer-recurring.md`

### Stage 2.5 — Game Commitment Loop (2026-05-30)

| Item | Status |
|------|--------|
| Pre-game chat opens | **Shipped** |
| Host finalize locks roster (fixed + flex) | **Shipped** — `finalize_game_commitment` |
| Mark Ready + unanimous gate | **Shipped** — `set_game_ready` |
| Leave game before finalize | **Shipped** — `leave_game` |
| Join limits (3 upcoming, no overlap) | **Shipped** |
| Profile past games + simplified settings | **Shipped** |
| Chats tab (game + friend inbox) | **Shipped** (2026-05-31) |
| Realtime sync (activities, chat, join) | **Shipped** (migration `017`) |
| Discover join-status on cards | **Shipped** (2026-05-31) |
| iOS expiry date parsing (Discover empty) | **Shipped** (2026-05-31) |
| Last-minute exit → flake score | **Shipped** — `activity_game_flakes` |
| Read-only past-game chat (72h grace) | **Shipped** |
| Block join after finalize | **Won't do** |
| Invite from chat → next game | **Shipped · Stage 3** |
| Recurring + invite-only | **Shipped · Stage 3** (teams schema still Stage 3–4) |
| My Games tab | **Shipped · Stage 3** |

See `docs/stage-2.5-game-commitment.md`, `docs/stage-3-organizer-recurring.md`, and `../open_items.md`.

### Stage 3.5 — Beta polish + Regulars foundation (2026-06-01)

| Track | Deliverable | Status |
|-------|-------------|--------|
| **3.5a** | Map off tab bar; stack screen from Discover | **Shipped** |
| **3.5b** | Badminton court seed + invite/recurring smoke test | **Docs + script** — run before sister’s beta |
| **3.5c** | Regulars / Groups schema (`groups`, `group_members`) | **Design** — build after 2 weekly hosts validate manually |

Full design: `docs/stage-3.5-beta-polish-and-regulars.md`. Physical QA: `docs/physical-device-beta-test.md`.

## Operating cost (estimate)

**~20 test users, light usage → about $0–10/month infra**, plus store fees if distributing builds.

| Service | ~20 testers | Notes |
|---------|-------------|--------|
| **Supabase** | **$0** (Free tier) | Well under MAU, DB, Realtime, Edge limits |
| **Firebase FCM** | **$0** | Push on Spark |
| **Google Maps/Places** | **$0–10** | Depends on map/autocomplete usage; budgets at $25 in `docs/google-cloud-budget.md` |
| **Sentry** | **$0** | Free tier at this volume |
| **Apple Developer** | **~$8/mo** amortized | $99/yr — only if TestFlight/App Store |
| **Google Play** | one-time $25 | Internal testing track |

Upgrade to **Supabase Pro (~$25/mo)** when you need: no project pause, daily backups, more support, or sustained traffic above Free limits.

Rate limits already protect runaway cost (`docs/stage-2-cost-metrics.md`): 300 discover/day, 500 chat msgs/day, 40 push/day per user.

## Product Evolution Plan

### V1 (Now) - MVP Partner Finding

- Goal: help users quickly find someone to play with.
- Focus: **Chats + Discover** with smooth join → lobby → finalize loop.
- Must-have: low-friction onboarding and obvious CTAs on empty screens.

### V2.1 - Match Optimization + Identity Trust

- Flexible activity setup and optimization to reduce host coordination burden.
- Anonymous-until-confirmed participant identity.
- Review system with minimum review threshold before score display.
- Profile + preference center and preference-aware homepage.
- Activity and friend chat foundation.

### V3 - Community Growth + Programs

- Tournament mode foundation and casual competitive formats.
- Better group orchestration and community retention loops.
- Local program structure for recurring activity communities.
- [x] **My Games as first-class tab** (2026-06-01).

### V4 - Owned Facilities + Membership Vision

- Stage A: use rally data to identify low-maintenance, high-demand sports formats.
- Stage B: run partner-venue pilots with measured cost and utilization targets.
- Stage C: launch Rally-managed affordable sport spaces (for example, pool/gym/court bundles).
- Stage D: unify into one Rally membership with behavior incentives and maintenance credits.
- Any biometric or facial-recognition initiative requires legal/privacy/security review before build.

## Known Issues Backlog

- [x] Revisit and properly fix Supabase REST trailing-slash `404` behavior.
  - Fixed by normalizing `SUPABASE_URL` once in `src/services/api/supabase.ts`.
- [ ] Metro stale bundle during dev — use `--reset-cache` + reload; confirm v5 pipeline panel when testing Discover.
- [ ] iOS Simulator: no push tokens — use Realtime in-app alerts or physical iPhone for push QA.

## Validation Sprint Quick Start (Next 2-3 Days)

1. Run **smoke test** on **two physical devices**: `docs/smoke-test-join-pickleball.md`.
2. Record outcomes in `docs/phase-3-validation-results.md`.
3. Run Phase 4 notification checklist on **physical** iPhone + Android.
4. Triage defects: data correctness → Realtime sync → push → UX polish.
5. Keep `docs/release-readiness-checklist.md` as final go/no-go gate.
