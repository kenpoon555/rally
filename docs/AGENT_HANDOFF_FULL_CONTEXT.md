# Rally — Full agent handoff (zero prior context)

**Last updated:** 2026-06-01  
**Purpose:** Single document so a new agent can continue without reading chat history or other repo files.

**Canonical product docs (merged from product review):** [VISION.md](../VISION.md) · [ROADMAP.md](../ROADMAP.md) · [open_items.md](../../open_items.md) · [NEXT.md](./NEXT.md) · [README.md](../../README.md)

---

## 1. What this project is

**Rally** is a React Native mobile app (Expo SDK 55) for finding and hosting pickup sports games (badminton, pickleball, etc.) near courts. Core loop: **Discover → create/join game → Game Room chat → finalize roster → play → optional reviews**.

| Item | Value |
|------|--------|
| App code root (git repo) | `/Users/kenpoon/Rally/RallyApp` |
| Parent folder | `/Users/kenpoon/Rally` (not always a git root) |
| GitHub remote | `https://github.com/kenpoon555/rally` |
| Expo account / project | `kendrewpoon` / `@kendrewpoon/rallyapp` |
| Bundle ID (iOS) | `com.rallyapp` |
| Preview Supabase project ID | `casljueycxsqexpkdiuq` |
| Apple Developer team | `68JKW6NXF6` (Kun Yu Poon, Individual) |
| Apple ID used for EAS | `kunyupoon495@gmail.com` |

**Stack:** Expo + React Navigation, Supabase (Postgres + RLS + RPCs + Realtime), `react-native-config` for env, EAS Build for preview installs, Firebase/APNs for push (physical devices only).

---

## 2. Git branches and deploy flow

```text
feature work  →  PR into main     (CI: test + lint only)
main          →  PR into preview  (CI + optional merge)
merge/push preview  →  deploy-preview.yml  →  EAS preview Android + iOS
```

| Branch | Role |
|--------|------|
| `dev` | Active feature branch (user’s day-to-day) |
| `preview` | Triggers EAS preview builds when updated |
| `main` | Stable; CI on push, no auto EAS deploy |

**At handoff time (verify with `git status` / `gh pr list`):**

- `dev` was at commit `863e14b` — *Fix CI lint errors — remove unused imports and destructured vars.*
- `preview` was **behind** `dev` by several commits (needs merge/push to get latest on phones).
- PR #2 (*Stage 3.5c redesign + Regulars RLS fix*, dev → preview): **MERGED**
- PR #3 (*Beta preview: roster capacity, 10 sports, trust UI, retention*, dev → preview): **MERGED**

**CI workflow:** `.github/workflows/ci.yml` — runs `npm run verify` (tests + lint) on PRs to `main`/`preview`.

**Deploy workflow:** `.github/workflows/deploy-preview.yml` — on push to `preview`, runs verify then `eas build --profile preview` for Android and iOS.

**Important:** User asked to push to `dev` and update open PR to preview; that work landed. Later PRs may have merged; **always re-check** `git log preview..dev` before assuming preview builds include latest JS.

---

## 3. Product decisions (do not re-litigate without user ask)

### 3.1 Teams / Stage 4

**Deferred** until liquidity exists (weekly Regulars without hand-holding). Do not build full “teams” product yet.

### 3.2 Payments / fee split

**Deferred.** No Stripe Connect / IAP fee split now. Shipped instead: optional **cost note** on activity (`~$8/person court`, BYO drinks) — informational only, settle in person/chat.

### 3.3 Anonymous identity

**Explicitly deferred** per user (2026-05-31): social apps (Instagram/LinkedIn) show real identity in threads; Rally should too for game coordination.

- **Removed from UI:** `displayIdentity.ts` deleted; Game Room / Discover / Activity Detail show **real usernames**.
- **Still in DB:** `can_view_profile_identity()` in migration `004` — unlocks identity after `match_status = finalized` + same activity; **not used** to mask names in lobby UI anymore.
- **Do not re-add** pre-finalize masking unless user requests.

### 3.4 Reviews

Per **game**, not per crew; accumulate on profile. Hidden on **upcoming** games in Activity Detail; post-game trust copy for Regulars.

### 3.5 Formal QA

User asked to **skip formal QA** and build liquidity features (cost note, announcements, group RSVP, scheduled next game for large Regulars crews).

---

## 4. Features shipped in this arc (code + migration)

### 4.1 Redesign Phases 1–6 (earlier on `dev`)

- Activity Detail as **modal sheet** from Game Room Details.
- **useUserPlayMode** + “Next up” card on Chats for Regular users.
- Regulars **group row** in chat inbox; Game Room header shows **group name** first.
- Migration **022** `join_group_and_next_game` — one crew invite link lands in Game Room.
- **List on Discover** (replaced misleading “Find players → Discover” navigation from DM).
- Badminton host onboarding, post-create share prompt, coach marks.
- Profile **v2** (identity-first; no “partners” wording).
- Admin report triage (usernames, Suspend & close).
- RLS fix **023** for `regular_group_members` infinite recursion.

### 4.2 Migration 025 — cost note, announcements, group RSVP (session work)

**File:** `supabase/migrations/025_cost_note_announcements_group_rsvp.sql`  
**Applied on preview Supabase** (`casljueycxsqexpkdiuq`) during session.

| Capability | Details |
|------------|---------|
| `activities.cost_note` | Optional text; host sets at create or on Activity Detail |
| `conversations.pinned_announcement` (+ timestamps/by) | Host-only via RPC `set_game_room_announcement` |
| `set_game_rsvp` | **Regulars group members** and **series members** can RSVP **before** join approval; caps **going** by court capacity (`player_count + missing_players`) |
| `ensure_activity_group_conversation` | Group members + RSVP (going/maybe) can open Game Room chat before approval |
| `schedule_group_next_game` | Host picks **future** `p_start_time` + `p_player_count` (e.g. 8 of 50 crew) for Regulars |

**Client files (main):**

- `src/components/GameRoomAnnouncementBanner.tsx` — cost + pinned banner in chat
- `src/components/GameRsvpBar.tsx` — `allowGroupRsvp` for group members
- `src/components/GameRoomActionBar.tsx` — datetime picker for next game; group schedule; RSVP in footer
- `src/pages/Activity/ActivityDetailScreen.tsx` — cost note editor; schedule picker; group RSVP
- `src/pages/Activity/CreateActivityScreen.tsx` — cost note on create
- `src/pages/Chat/ChatThreadScreen.tsx` — banner above messages
- `src/services/activityService.ts` — `scheduleGroupNextGame`, `cost_note` on create
- `src/services/chatService.ts` — `setGameRoomAnnouncement`, `getActivityConversationAnnouncement`
- `src/services/regularGroupService.ts` — `isRegularGroupMember`

### 4.3 Later commits on `dev` (after session PR push — verify in tree)

Handoff snapshot showed additional work **not fully detailed in chat** but on `dev`:

- `5303a5d` / `754cc2c` — cost note + announcements + group RSVP; CI lint fixes
- `e4ececd` — Beta preview: roster capacity, 10 sports, trust UI, retention instrumentation
- `a302c3b` — LA closed beta: court seeds, dev fallback, invite copy
- `863e14b` — More CI lint fixes
- Migrations **026–028** exist in repo (crew retention funnel, entitlements, roster capacity approve) — **confirm applied** on preview DB before assuming RPCs exist in cloud.

---

## 5. iOS install for family tester (“sister’s iPhone”) — CRITICAL

### 5.1 Why install failed

Preview profile in `eas.json`:

```json
"preview": { "distribution": "internal" }
```

iOS **internal/ad hoc** builds only install on devices whose **UDID** is in the **provisioning profile** used to sign that `.ipa`. User’s phone worked; sister’s did not until registered + **new build**.

This is **not** TestFlight. TestFlight = email invites, no per-device UDID (future path).

### 5.2 What user completed

1. `npx eas-cli device:create` → **Website** → QR/link:  
   `https://expo.dev/register-device/f825775a-a57c-4437-8051-c957596ea4e9`  
   Sister installed profile on **her iPhone in Safari**.

2. `npx eas-cli device:list` — **two devices** on team `68JKW6NXF6`:

| UDID | Likely owner |
|------|----------------|
| `00008140-001028220402201C` | Host (Ken) — older registration |
| `00008150-000849441EE2401C` | Sister — created 2026-05-31 |

3. Provisioning profile **still showed only one device** until user deleted old profile or triggered rebuild with device picker.

4. `npx eas-cli build --profile preview --platform ios` — at device selection, **both devices selected (◉)** → correct.

5. Build was **Queued** on Expo **Free Tier Queue** (~7+ min queue normal; total often 20–60 min including compile). Not a code failure.

### 5.3 Next agent actions for sister install

1. Confirm build status on https://expo.dev/accounts/kendrewpoon/projects/rallyapp/builds — must be **Finished**.
2. Sister installs **only that new build** via Safari install link/QR.
3. If “Untrusted developer”: Settings → General → VPN & Device Management → trust.
4. Optional verify: `npx eas-cli credentials -p ios` → preview → **Provisioned devices** lists **both** UDIDs.
5. If `preview` branch is behind `dev`, merge dev → preview and wait for **new** CI/EAS build so she gets latest JS/features.

### 5.4 Commands cheat sheet (iOS beta)

```bash
cd /Users/kenpoon/Rally/RallyApp

# Register new tester phone
npx eas-cli device:create

# List registered UDIDs
npx eas-cli device:list

# Refresh signing / see provisioned devices
npx eas-cli credentials -p ios   # choose profile: preview

# Build iOS preview (interactive device pick)
npx eas-cli build --profile preview --platform ios

# Or trigger via git
git push origin preview   # after merging dev
```

**Do not** add a new Distribution Certificate unless cert expired — only provisioning profile needed more devices.

---

## 6. Supabase migrations (reference)

Apply order through **028** on preview project; session confirmed **025** applied; **026–028** may need apply if not done:

| Migration | Topic |
|-----------|--------|
| 020 | Series, RSVP, invite tokens |
| 021 | `regular_groups`, `regular_group_members` |
| 022 | `join_group_and_next_game` |
| 023 | Fix RLS recursion on group members |
| 024 | Admin report queue triage |
| 025 | Cost note, pinned announcement, group RSVP, schedule_group_next_game |
| 026 | Crew retention funnel |
| 027 | Entitlements and court freshness |
| 028 | Roster capacity approve |

**RPCs the app calls (non-exhaustive):**  
`set_game_rsvp`, `set_game_room_announcement`, `schedule_group_next_game`, `schedule_next_game_from_activity`, `spawn_series_occurrence`, `join_group_and_next_game`, `create_regular_group_from_activity`, `is_regular_group_member`, `ensure_activity_group_conversation`, `finalize_game_commitment`, `can_view_profile_identity` (reviews/profile; not lobby mask).

---

## 7. CI failure fixed in session

**Job:** `Test & lint` on PR #2 — failed on **2 ESLint errors** (warnings OK):

1. `CreateActivityScreen.tsx` — duplicate StyleSheet key `advancedToggle` (merged into one entry).
2. `ProfileScreen.tsx` — unused import `FULL_LEGAL_SECTIONS`.

**Fix commit:** `754cc2c` then later `863e14b` on `dev`. Verify with `npm run lint` (0 errors).

---

## 8. Key UX surfaces (navigation)

| Screen | Path / component | Notes |
|--------|----------------|-------|
| Discover | `HomeScreen.tsx` | Empty state mentions host + Regulars link |
| Create game | `CreateActivityScreen.tsx` | Cost note in advanced; “Need players tonight” |
| Activity Detail | `ActivityDetailScreen.tsx` | Modal from Game Room; cost note, RSVP, schedule next |
| Game Room | `ChatThreadScreen.tsx` + `GameRoomActionBar.tsx` | Header, footer, announcement banner |
| Chats inbox | `ChatListScreen.tsx` | Next up card; hide empty when card shown |
| Profile | `ProfileScreen.tsx` | v2 settings hub |
| Admin | `AdminScreen.tsx` | Report triage |

**Routes:** `src/constants/routes.ts`  
**Deep links:** `rallyapp://` invite and group invite — `src/navigation/deepLinking.ts`

---

## 9. Large-group RSVP scenario (50-person crew, 8 court spots)

**User story:** WhatsApp group of ~50; host posts “8 want badminton?” — members RSVP without all being approved joiners.

**How it works:**

1. Host has **Regulars group** linked to activities (`regular_group_id`).
2. Host schedules game with capacity e.g. **8** (`player_count` + `missing_players` or `schedule_group_next_game(p_player_count := 8)`).
3. Any **group member** sees **GameRsvpBar** with `allowGroupRsvp` — Going/Maybe/Can't go.
4. DB enforces max **going** = capacity − 1 (host slot).
5. Host still **finalizes roster** for who actually plays; RSVP is signal, not auto-approve all 50.
6. Members can open Game Room chat via updated `ensure_activity_group_conversation`.

---

## 10. Known limitations / QA notes

| Topic | Note |
|-------|------|
| iOS Simulator | No FCM push token |
| Push | Join, approval, finalize on **physical devices** |
| Preview queue | Free tier — long “Queued” wait normal |
| `preview` behind `dev` | Phones won’t get latest until preview updated + rebuild |
| Reviews | Phase 7 device checklist exists; anonymous-until-confirmed **deferred** in UI |
| Dev diagnostics | Discover location debug panel may still show in `__DEV__` — hide before TestFlight |
| Metro / iOS local | User had wedged xcodebuild; JS-only changes can reload installed app |

---

## 11. Open / not done (for next agent)

- [ ] Confirm sister installed from **Finished** iOS build with **both** UDIDs in profile.
- [ ] Merge `dev` → `preview` if preview is behind; wait for EAS iOS+Android builds.
- [ ] Apply migrations **026–028** on preview Supabase if not applied (`supabase db push` or MCP `apply_migration`).
- [ ] Discover zero-liquidity empty state (mentioned, may be partial in HomeScreen copy only).
- [ ] Hide dev diagnostics on preview builds.
- [ ] TestFlight path for wider beta (no UDID) — not set up; production profile + `eas submit`.
- [ ] Funnel metrics / retention — PR #3 area; verify events in code.
- [ ] User parallel QA on current `dev` — don’t block on formal QA doc unless asked.

---

## 12. User rules for agents

- **Do not git commit** unless user explicitly asks.
- **Do not force push** main/master.
- Use `gh` for GitHub; EAS/Expo for builds.
- Prefer minimal diffs; match existing code style.
- Workspace path: `/Users/kenpoon/Rally`; git root: `RallyApp/`.

---

## 13. Conversation transcript (optional deep dive)

Full JSONL (tool calls stripped in export):  
`/Users/kenpoon/.cursor/projects/Users-kenpoon-Rally/agent-transcripts/d1921bee-e88b-44d2-ba3b-d1ad5e4a0a1a/d1921bee-e88b-44d2-ba3b-d1ad5e4a0a1a.jsonl`

Search keywords: `cost_note`, `anonymous`, `device:create`, `5303a5d`, `754cc2c`, `Regulars`, `GameRsvpBar`.

---

## 14. Quick verification checklist (next agent, 10 min)

```bash
cd /Users/kenpoon/Rally/RallyApp
git fetch && git status && git log -1 --oneline
npm run lint
gh pr list --state open
npx eas-cli device:list    # interactive: pick team 68JKW6NXF6
# Check latest iOS preview build: Finished + install link
```

**Success for sister:** She opens Rally preview app from **today’s** Expo iOS build, signs in, can RSVP on a Regulars-linked game if she’s in the crew.

---

*End of handoff document.*
