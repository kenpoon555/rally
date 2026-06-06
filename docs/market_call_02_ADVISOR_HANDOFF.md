# Market Call 02 — Engineering Handoff for Advisor Agent

**Date:** 2026-06-02  
**Audience:** Advisor / strategy agent (no repo access required)  
**Purpose:** Pick up product strategy, execution sequencing, and QA after S1–S11 build sprint  
**Canonical companions:** [vision.md](./vision.md) · [01_executionplan.md](./01_executionplan.md) · [../../open_items.md](../../open_items.md)

---

## Executive summary

Rally is a **React Native + Supabase** closed beta for **LA badminton, pickleball, and basketball**. The free loop is: **discover → join → chat → play → replay with the same Rally (Regulars crew)**.

Between the prior advisor review (migrations through **032**, crew chat + Dynamic Home) and this handoff, engineering shipped **S1–S11** — migrations **036–046**, covering Group Play OS, post-game tooling, host utilities, full **Phase 4 liquidity** (captains, need players, free agents, concierge, landing pages), **Phase 5 partners**, sport templates, auto-fill, and session card polish.

**Strategic gate unchanged:** Do **not** build Teams, Leagues, or payments until **crew replay %** is validated. North-star metric: `% of Regulars groups with ≥1 replay` (`analytics_crew_lifecycle.retained`).

**Engineering posture now:** Feature verticals in the execution plan are largely **built**. The next cycle should be **validate → measure → recruit hosts → ops cadence** — not broad new scope.

---

## What Rally is (product primitives)

| Primitive        | User-facing name      | Behavior                                                                                                                   |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Public game      | Discover game         | Listed publicly; join **request** → host approves; `activity_group` chat                                                   |
| Rally game       | Rally session         | Tied to a persistent **Rally** (`regular_group`); one **Rally chat** (`crew_group`); flow: **Join → I'm in → Lock roster** |
| Rally            | Rally / Regulars crew | Persistent group with invite link, crew chat, session cards, leaderboard, polls                                            |
| Host tools       | Game room             | Roster, nudge, fill-ins, need-player post, payment hint, rotation, recap                                                   |
| Liquidity boards | Discover tabs         | Need players, Free agents, Coaches, Intro nights, Partner venues                                                           |

**Locked decisions (do not re-litigate):**

- Join = tentative; **I'm in** = commit; **Lock roster** = final
- Monetization deferred until retention proven
- LA-only beta copy; second city deferred (Phase 6.3)
- Guests / unified public-as-Rally / Teams / Leagues — not built

---

## Build chronology (S1–S11)

| Sprint  | Phases          | What shipped                                                                                       |
| ------- | --------------- | -------------------------------------------------------------------------------------------------- |
| **S1**  | 1.1 + 1.2       | Session polish foundations + **availability poll** (`poll_v1`) in crew chat                        |
| **S2**  | 1.3             | **Auto rotation / pairing** (`rotation_v1`) in locked game room                                    |
| **S3**  | 1.4 + 1.5       | **Mini tournament** + **in-group leaderboard**                                                     |
| **S4**  | 2.1 + 2.2       | **Post-game recap** card + **venue block** / default court                                         |
| **S5**  | 3.2 + 2.3       | **Nudge non-responders** + **payment handle** in profile                                           |
| **S6**  | 4.1 + 4.2       | **Sport captain program** + **Need Players board**                                                 |
| **S7**  | 4.3 + 4.5       | **Free Agent board** + **city/sport landing pages** (`rallyapp://la/{sport}`)                      |
| **S8**  | 5.x + 6.1       | **Venue partners**, **coach listings**, **intro session flag**, **sport templates** on Create Game |
| **S9**  | 3.4 + 4.4 + 6.2 | **Auto-fill** (free agents + seekers), **concierge intake**, **captain feedback**                  |
| **S10** | 4.4 + 5.3       | **Concierge ops** (admin match game picker) + **intro night admin calendar**                       |
| **S11** | 1.1             | **`get_session_card_payload`** — single RPC session cards in crew + chat                           |

---

## Database migrations applied (036–046)

Deploy pattern used throughout:  
`npx supabase db query --linked -f supabase/migrations/NNN_*.sql` then `npx supabase migration repair --status applied NNN`

| Migration | Phase           | Contents                                                                                                                                      |
| --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **036**   | 1.2             | Availability polls (`availability_polls`, vote RPCs, `poll_v1` flag)                                                                          |
| **037**   | 1.3             | Session rotations (`session_rotations`, `get_session_rotation_state`)                                                                         |
| **038**   | 1.5             | Rally leaderboard (`rally_leaderboard_entries`, panel RPC)                                                                                    |
| **039**   | 2.1 + 2.2       | Game recap + venue fields on `activity_locations`                                                                                             |
| **040**   | 3.2 + 2.3       | Nudge (`nudge_session_roster`, `nudge_v1`) + payment handle (`set_profile_payment`, `get_host_payment_hint`)                                  |
| **041**   | 4.1 + 4.2       | Captains (`sport_captains`, applications), Need Players (`need_player_posts`, requests), `need_players_v1`                                    |
| **042**   | 4.3 + 4.5       | Free agents (`free_agent_posts`, invites), `get_sport_landing_payload`, `sport-landing` edge, `free_agents_v1`                                |
| **043**   | 5.x + 6.1       | Partners (`partner_tier`), coaches (`coach_listings`), `is_intro_session`, `sport_templates`, `intro_sessions_v1`                             |
| **044**   | 3.4 + 4.4 + 6.2 | Auto-fill (`activity_fill_invites`, `suggest_fill_ins`), concierge (`concierge_requests`), captain feedback, `fill_ins_v1`                    |
| **045**   | 4.4 + 5.3       | Concierge ops (`admin_search_match_games`, `matched_activity_id`), intro ops (`admin_set_intro_session`, `admin_list_public_games_for_intro`) |
| **046**   | 1.1             | Session card payload (`get_session_card_payload`, `list_crew_session_cards`, `list_conversation_session_cards`)                               |

**Edge functions to deploy when copy/HTML changes:** `send-push` (roster_nudge, free_agent_invite), `sport-landing`.

---

## Feature inventory by phase (execution plan status)

### Complete [x]

| Phase   | Feature                     | User outcome                                   | Key surfaces                                                           |
| ------- | --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| 0.4–0.5 | Session cards + attendance  | Join → I'm in → Lock; post-game reliability    | `CrewGameSessionCard`, `GameRoomActionBar`, `PostGameAttendanceScreen` |
| 1.1–1.5 | Group Play OS               | Polls, rotation, mini tourney, leaderboard     | Crew chat, game room, `RegularsCrewScreen`                             |
| 2.1–2.3 | Post-game + venue + payment | Recap share, court info, Venmo/etc handle      | Chat recap card, `VenueBlock`, Profile Payments                        |
| 3.1–3.4 | Host growth                 | Schedule next, nudge, invites, **auto-fill**   | Game room, Discover, Profile invites                                   |
| 4.1–4.5 | Liquidity                   | Captains, need/free boards, concierge, landing | Discover tabs, Profile, Admin, `SportLandingScreen`                    |
| 5.1–5.3 | Partners + seeding          | Partner venues, coaches, intro nights          | Play/Discover, Admin intro calendar                                    |
| 6.1–6.2 | Sport ops                   | Create Game templates, captain feedback        | Create Game, Profile (captains), Admin                                 |

### Partial [~]

| Phase             | Feature                            | Gap                                                       |
| ----------------- | ---------------------------------- | --------------------------------------------------------- |
| **0.6**           | Today tab, inbox, game room polish | Ongoing QA; no known blocker                              |
| **2.4**           | Social proof on profile            | Reliability + reviews exist; **no streak badges**         |
| _(none critical)_ | 4.4 concierge                      | Built in-app; **manual DM + deep link** still founder ops |

### Deferred [ ]

| Phase      | Feature                  | Gate                                   |
| ---------- | ------------------------ | -------------------------------------- |
| **6.3**    | Second city              | LA retention + captains playbook first |
| Stages 4–7 | Teams, Leagues, payments | Crew replay % proven                   |

---

## RPC quick reference (advisor-facing names → shipped)

| Plan name           | Shipped RPC / component                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `commit_session`    | `set_game_ready`                                                                                               |
| `lock_roster`       | `finalize_game_commitment`                                                                                     |
| `nudge_session`     | `nudge_session_roster`                                                                                         |
| `duplicate_session` | `schedule_next_game_from_activity`                                                                             |
| Need board          | `create_need_player_post`, `list_need_player_posts`, `request_need_player_spot`, `respond_need_player_request` |
| Free agents         | `create_free_agent_post`, `invite_free_agent`, `respond_free_agent_invite`                                     |
| Fill-ins            | `suggest_fill_ins`, `invite_fill_in`, `respond_fill_invite`                                                    |
| Concierge           | `submit_concierge_request`, `admin_list_concierge_requests`, `admin_search_match_games`                        |
| Intro ops           | `admin_list_public_games_for_intro`, `admin_set_intro_session`                                                 |
| Session card        | `get_session_card_payload`, `list_crew_session_cards`, `list_conversation_session_cards`                       |
| Landing             | `get_sport_landing_payload` + edge `sport-landing`                                                             |
| Partners            | `list_partner_venues`, `list_coach_listings`, `list_intro_sessions`                                            |
| Templates           | `get_sport_template`                                                                                           |

---

## Feature flags (`app_feature_flags`)

| Flag                 | Features                   |
| -------------------- | -------------------------- |
| `poll_v1`            | Availability polls         |
| `rotation_v1`        | Session rotation panel     |
| `mini_tournament_v1` | Mini tournament            |
| `need_players_v1`    | Need Players board         |
| `free_agents_v1`     | Free Agent board           |
| `fill_ins_v1`        | Host auto-fill suggestions |
| `intro_sessions_v1`  | Intro night badge + lists  |
| `nudge_v1`           | Roster nudge               |

All shipped flags are **enabled=true** on linked Supabase unless manually toggled.

---

## Key client files (for engineering continuity)

| Area                 | Path                                                |
| -------------------- | --------------------------------------------------- |
| Execution plan       | `RallyApp/docs/01_executionplan.md`                 |
| Vision               | `RallyApp/docs/vision.md`                        |
| Business stages      | `open_items.md`                                     |
| Product copy         | `RallyApp/src/constants/productCopy.ts`             |
| Game room            | `RallyApp/src/components/GameRoomActionBar.tsx`     |
| Session cards        | `RallyApp/src/components/CrewGameSessionCard.tsx`   |
| Crew chat sessions   | `RallyApp/src/components/CrewChatSessionList.tsx`   |
| Discover / Play      | `RallyApp/src/pages/Home/HomeScreen.tsx`            |
| Profile              | `RallyApp/src/pages/Profile/ProfileScreen.tsx`      |
| Admin ops            | `RallyApp/src/pages/Admin/AdminScreen.tsx`          |
| Landing              | `RallyApp/src/pages/Landing/SportLandingScreen.tsx` |
| Session card service | `RallyApp/src/services/sessionCardService.ts`       |
| Fill-in service      | `RallyApp/src/services/fillInService.ts`            |
| Concierge service    | `RallyApp/src/services/conciergeService.ts`         |

---

## Analytics events (minimum instrumentation)

Already tracked (extend as needed):

- `session_created`, `session_locked`, `attendance_submitted`
- `poll_created`, `poll_voted`, `rotation_generated`, `tournament_started`
- `recap_shared`, `need_post_created`, `free_agent_invited`, `fill_in_invited`
- `captain_application_submitted`, `partner_rally_session`
- `concierge_request_submitted`, `captain_feedback_submitted`
- Crew funnel: `regular_group_created`, `crew_invite_redeemed`, `crew_replayed` (migration 026 views)

**Advisor action:** After QA, query `analytics_crew_lifecycle` and `analytics_crew_funnel_30d` on preview/prod.

---

## Recommended next cycle (vision → execute → test)

### 1. Vision (advisor agent)

- Re-read [vision.md](./vision.md) and [open_items.md](../../open_items.md) against this handoff.
- Confirm **no new product verticals** until P0 QA + replay metric read.
- Decide: **guests** (Phase 3), **streak badges** (2.4), or **host recruitment playbook** — pick one wedge, not all three.
- Update vision doc only where strategy changed (e.g. liquidity boards now live → update GTM for captains/intro nights).

### 2. Execute (founder + eng, only after vision lock)

| Priority | Work                                        | Rationale                            |
| -------- | ------------------------------------------- | ------------------------------------ |
| P0       | TestFlight / preview install reliability    | Still blocker per `open_items.md`    |
| P0       | Run full test list below on **two devices** | Validates S1–S11                     |
| P0       | Query replay %                              | Answers retention gate               |
| P1       | Recruit 5–10 LA hosts                       | Liquidity boards empty without hosts |
| P1       | Weekly intro night ops (Admin calendar)     | Seeds strangers → second session     |
| P1       | Concierge match 3–5 real users              | Validates 4.4 ops loop               |
| P2       | 2.4 streak badges OR 0.6 polish             | Only if QA clean                     |
| —        | 6.3 second city                             | Defer                                |

### 3. Test (founder QA — use checklist below)

Primary script: [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md) (core loop).  
This doc adds **S1–S11 delta tests** for new verticals.

---

## Test list — Market Call 02

Use **two accounts** (Host A + Player B) on preview/linked Supabase with migrations **036–046** applied. Check boxes as you go.

### A. Core loop (P0 — must pass before anything else)

- [ ] **A1** Host creates Rally → share invite → B redeems → both in crew
- [ ] **A2** Host schedules session → session card appears in Rally chat
- [ ] **A3** B joins session → taps **I'm in** → `ready_at` persists after refresh
- [ ] **A4** Host **Lock roster** only enabled when ≥1 non-host joiner (S11)
- [ ] **A5** Locked state visible on session card + game room
- [ ] **A6** Post-game attendance → reliability updates on profile
- [ ] **A7** Schedule next game → new session in same Rally chat
- [ ] **A8** Dynamic Home: Next Up, needs I'm in, ready-to-lock CTA correct

### B. Public Discover (P0)

- [ ] **B1** Create public game → appears on Discover
- [ ] **B2** B sends join request → A approves → B in game room
- [ ] **B3** Public game lock roster + chat work independently of Rally

### C. Group Play OS (S1–S3)

- [ ] **C1** Availability poll: create in crew chat → members vote → host sees tally
- [ ] **C2** Lock roster → rotation panel generates pairings (badminton/pickleball)
- [ ] **C3** Mini tournament: host creates → members see standings
- [ ] **C4** Rally leaderboard updates after session activity

### D. Post-game + host utilities (S4–S5)

- [ ] **D1** Game recap appears in chat after session; share text works
- [ ] **D2** Venue block shows court/parking; crew default court saves
- [ ] **D3** Host sets payment handle in Profile → `HostPaymentHint` in game room
- [ ] **D4** Host nudges non-ready roster → push received (if push configured)

### E. Liquidity boards (S6–S7)

- [ ] **E1** Discover **Need players** tab: post visible, B requests, A accepts
- [ ] **E2** Profile captain application → Admin approves → badge on Rally
- [ ] **E3** B posts **Free agent** availability → A invites from game room
- [ ] **E4** B accepts invite on Profile → lands in game, roster updates
- [ ] **E5** Sport landing `rallyapp://la/badminton` (or edge URL) shows open games + captains

### F. Partners + templates (S8)

- [ ] **F1** Partner venue filter on Play; partner badge on game card
- [ ] **F2** Coaches carousel loads seeded listings
- [ ] **F3** Create Game uses sport template defaults (roster, duration, hints)
- [ ] **F4** Host toggles **Intro session** on public create → appears in Intro nights list

### G. Auto-fill + concierge + captain feedback (S9)

- [ ] **G1** Host open public game with missing spots → fill-in suggestions (agents + seekers)
- [ ] **G2** Host invites seeker → B accepts on Profile → joined + I'm in path works
- [ ] **G3** **Find players** button routes to Discover (need_players + sport filter)
- [ ] **G4** Profile concierge request → Admin moderation queue
- [ ] **G5** Active captain submits feedback → Admin list shows entry

### H. Ops tooling (S10)

- [ ] **H1** Admin **Intro nights**: upcoming public games listed; toggle intro badge → shows on Play + landing
- [ ] **H2** Admin **Concierge**: expand request → pick open game → Mark matched → `matched_activity_id` set
- [ ] **H3** Founder manual DM + deep link to matched game (ops step, not automated)

### I. Session card payload (S11)

- [ ] **I1** Rally crew screen: cards show `X in · Y open · Z ready` and lock hints
- [ ] **I2** Host alone: Lock roster **disabled**
- [ ] **I3** Waitlisted player sees waitlist `#N` on card
- [ ] **I4** Crew chat session list loads via single RPC (no profile embed errors)
- [ ] **I5** Empty crew: host sees **Schedule first session** CTA

### J. Admin + safety (smoke)

- [ ] **J1** Admin metrics tab loads (migration 035+)
- [ ] **J2** Captain applications queue works
- [ ] **J3** Report / block flow still works on profile and chat

### K. Regression watchlist (known past issues)

- [ ] **K1** Home does **not** show "Ready to lock" with host-only roster
- [ ] **K2** Rally profile screen loads without PostgREST relationship error
- [ ] **K3** One inbox row per Rally (no duplicate activity_group chats for crew games)

### L. Metrics (after functional QA)

- [ ] **L1** Query `analytics_crew_lifecycle` — replay % for beta cohort
- [ ] **L2** Query `analytics_crew_funnel_30d` — invite → join → replay funnel
- [ ] **L3** Record: DAU, games created 7d, joins approved 7d (Admin metrics)

---

## Open questions for advisor agent

1. **Scope freeze:** Given S1–S11 completion, does advisor still recommend "no new scope this week" or prioritize **guests** vs **host recruitment**?
2. **Liquidity sequencing:** Which board to pump first — Need players, Free agents, or Intro nights?
3. **Captain program:** How many active captains needed per sport before second city talk?
4. **Concierge SLA:** Is `<7 days to first game` the right beta KPI for manual matching?
5. **Monetization probe:** Any signal from captains/host tools that suggests **Organizer Pro** wedge timing?
6. **Vision doc refresh:** Which sections of `vision.md` are now stale given Phase 4–5 ship?

---

## Document lineage

| Doc                                                                                          | Role                                         |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| This file                                                                                    | Market Call 02 — advisor pickup + test list  |
| [01_executionplan.md](./01_executionplan.md)                                                 | Engineering tracker (S1–S11 done)            |
| [archive/ADVISOR_REVIEW_MERGED_2026-06-03.md](./archive/ADVISOR_REVIEW_MERGED_2026-06-03.md) | Prior advisor merge (pre-S1)                 |
| [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md)                                     | Core crew loop QA                            |
| [WHAT_NEXT.md](./WHAT_NEXT.md)                                                               | Short pointer — update to reference this doc |

---

_Generated 2026-06-02 after S11. Next session: advisor reads this → updates vision → founder runs test list → query replay % → decide single next wedge._
