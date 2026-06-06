# Rally Feature Execution Plan

**Purpose:** How to ship each roadmap feature so it is **available in the app** — schema, RPCs, UI, rollout, and validation.

**Stack:** React Native · Supabase (Postgres, RLS, RPCs, Realtime) · LA badminton · pickleball · basketball closed beta.

**Companion docs:** [vision.md](./vision.md) (strategy) · [open_items.md](../../open_items.md) (business stages / monetization gates)

**Last updated:** 2026-06-02 · **Current sprint:** S11 done — session card payload RPC + roster polish

---

## Progress tracker

Check items as they ship. `[~]` = partial. Business Stages in `open_items.md` map to these Phases (not 1:1).

| Phase | Item                                 | Status | Shipped RPC / notes                                                                      |
| ----- | ------------------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| 0.4   | Session cards (Join → I'm in → Lock) | [x]    | `set_game_ready`, `finalize_game_commitment`, `CrewGameSessionCard`, `GameRoomActionBar` |
| 0.5   | Attendance & reliability             | [x]    | `submit_game_attendance`, `PostGameAttendanceScreen`, profile reliability                |
| 0.6   | Today tab, inbox, game room polish   | [~]    | Ongoing QA                                                                               |
| 1.1   | Session card polish                  | [x]    | migration `046` · `get_session_card_payload` · ready count · lock gating · waitlist #    |
| 1.2   | Availability poll                    | [x]    | migration `036` · crew chat Poll composer                                                |
| 1.3   | Auto rotation / pairing              | [x]    | migration `037` · `SessionRotationPanel` in locked game room                             |
| 1.4   | Mini tournament                      | [x]    | `create_regular_group_tournament` + `MiniTournamentScreen`                               |
| 1.5   | In-group leaderboard                 | [x]    | migration `038` · `RallyLeaderboardPanel` on crew screen                                 |
| 2.1   | Post-game recap                      | [x]    | migration `039` · `GameRecapCard` in chat · text share                                   |
| 2.2   | Court / venue info                   | [x]    | `activity_locations` venue fields · `VenueBlock` · default court on crew                 |
| 2.3   | Payment handle in profile            | [x]    | migration `040` · Profile Payments · `HostPaymentHint` in game room                      |
| 2.4   | Social proof on profile              | [~]    | Reliability + reviews; no streak badges                                                  |
| 3.1   | Schedule next / reuse game           | [x]    | `schedule_next_game_from_activity`                                                       |
| 3.2   | Nudge non-responders                 | [x]    | migration `040` · `nudge_session_roster` · crew card + game room                         |
| 3.3   | Invite previous players              | [x]    | Invite links + crew membership                                                           |
| 3.4   | Auto-fill from public pool           | [x]    | migration `044` · `suggest_fill_ins` · `FillInSuggestionCard` in game room               |
| 4.1   | Sport captain program                | [x]    | migration `041` · apply in Profile · admin approve · Partner Rally badge                 |
| 4.2   | Need Players board                   | [x]    | migration `041` · Discover tab · post from game room · request/accept flow               |
| 4.3   | Free Agent board                     | [x]    | migration `042` · Discover + Profile · host invite in game room                          |
| 4.4   | Manual concierge matching            | [x]    | migration `044`–`045` · Profile intake · Admin match game picker + activity link         |
| 4.5   | City + sport landing pages           | [x]    | `get_sport_landing_payload` · `SportLandingScreen` · `sport-landing` edge HTML           |
| 5.1   | Venue partner profiles               | [x]    | migration `043` · partner badge · Discover filter                                        |
| 5.2   | Coach / clinic listings              | [x]    | `coach_listings` · CoachesCarousel on Play                                               |
| 5.3   | Intro sessions (seed)                | [x]    | `is_intro_session` · Play/landing list · Admin intro night calendar (`045`)              |
| 6.1   | Sport config templates               | [x]    | `sport_templates` · Create Game defaults via `get_sport_template`                        |
| 6.2   | Captain feedback backlog             | [x]    | migration `044` · Profile form (active captains) · Admin list                            |
| 6.x   | 2nd city expansion                   | [ ]    | Deferred                                                                                 |

**RPC name map** (plan → shipped): `join_session` → join crew game RPCs · `commit_session` → `set_game_ready` · `lock_roster` → `finalize_game_commitment` · `submit_attendance` → `submit_game_attendance` · `duplicate_session` → `schedule_next_game_from_activity` · `nudge_session` → `nudge_session_roster` · payment profile → `set_profile_payment` / `get_host_payment_hint` · captain apply → `submit_captain_application` · need board → `create_need_player_post` / `list_need_player_posts` / `request_need_player_spot` / `respond_need_player_request` · free agents → `create_free_agent_post` / `invite_free_agent` / `respond_free_agent_invite` · landing → `get_sport_landing_payload` · partners → `list_partner_venues` / `list_coach_listings` / `list_intro_sessions` · templates → `get_sport_template` · fill-ins → `suggest_fill_ins` / `invite_fill_in` / `respond_fill_invite` · concierge → `submit_concierge_request` / `admin_list_concierge_requests` / `admin_search_match_games` · intro ops → `admin_list_public_games_for_intro` / `admin_set_intro_session` · session card → `get_session_card_payload` / `list_crew_session_cards` / `list_conversation_session_cards` · captain feedback → `submit_captain_feedback` / `admin_list_captain_feedback`

---

## How to Read This Doc

Each feature includes:

- **User outcome** — what "available" means

- **Backend** — tables, RPCs, RLS

- **Client** — screens/components

- **Rollout** — beta flags, captain program tie-in

- **Validation** — QA + metric

---

# Phase 0 — Beta Reliability (Maintain)

## 0.4 Session Cards (Join → I'm in → Lock)

**User outcome:** Session appears in Rally chat; members join, commit, host locks roster.

**Backend**

- Ensure `activities` (or session table) links to `regular_group_id` + `conversation_id`.

- RPCs: `join_session`, `commit_session` (I'm in), `lock_roster`, `get_session_roster`.

- RLS: members of Rally read; host-only for lock; joiners can update own row.

- Realtime: subscribe to session row + roster for card updates.

**Client**

- `SessionCard` in chat thread: states `open | joining | committed | locked | completed`.

- Host actions: Lock roster, Mark attendance (post-game).

- Home: surface next session for user's Rallies.

**Rollout:** On for all beta users.

**Validation:** Two-device test — join, I'm in, lock, attendance; reliability updates.

---

## 0.5 Attendance & Reliability

**User outcome:** After lock + game, host marks attended; profile shows reliability.

**Backend**

- `session_attendance` or extend roster with `attended boolean`.

- RPC `submit_attendance(session_id, user_ids[])`.

- Materialized or view: `confirmed_attended / committed_sessions` per user.

- Trigger: update profile reliability on attendance submit.

**Client**

- Post-game sheet on session card (host only).

- Profile reliability line + tooltip.

**Validation:** Committed-but-no-show lowers reliability; attended raises it.

---

# Phase 1 — Group Play OS

## 1.1 Session Card Polish

**Status:** [x] Shipped · migration `046` · `list_crew_session_cards` + `list_conversation_session_cards` · ready/lock/waitlist on `CrewGameSessionCard`

**User outcome:** Roster is always clear; host sees who still needs to tap I'm in.

**Backend**

- RPC `get_session_card_payload(session_id)` — single round trip: session, roster, counts, host flags, waitlist.

- Index: `(regular_group_id, starts_at)` for Home queries.

**Client**

- Card states: spot count, I'm in count, waitlist position.

- Host chip row: Nudge, Lock (disabled until ≥1 non-host joiner).

- Empty state: "Schedule first session" CTA.

**Rollout:** Ship to all; no flag.

**Validation:** Home "Ready to lock" only when non-host joiners exist.

---

## 1.2 Availability Poll

**Status:** [x] Shipped · `036_availability_polls.sql` · `poll_v1` flag on

**User outcome:** Before scheduling, group votes on time slots; host picks winner and creates session.

**Backend**

```sql

-- New tables (conceptual)

polls (id, regular_group_id, conversation_id, created_by, title, closes_at, status)

poll_options (id, poll_id, label, starts_at, ends_at)

poll_votes (poll_id, option_id, user_id, unique per option/user)

```

- RPCs: `create_poll`, `vote_poll`, `close_poll`, `poll_results`.

- RLS: Rally members read/write own votes; creator closes.

- Optional: Realtime on `poll_votes` for live counts.

**Client**

- Composer in Rally chat: **New poll** (add 2–6 time options).

- `PollCard` in thread: tap to vote, live counts, "Create session from winner" (host).

- Flow: Poll → host taps winning option → pre-filled session create sheet.

**Rollout**

- Beta: badminton + pickleball Rallies first.

- Captain Partner Rallies get access week 1; all Rallies week 2.

**Validation:** ≥30% of active Rallies create ≥1 poll in first month.

---

## 1.3 Auto Rotation / Pairing Generator

**Status:** [x] Shipped · `037_session_rotations.sql` · `rotation_v1` flag on · racket crew games only

**User outcome:** Host taps Generate; app assigns doubles (or singles ladder) avoiding repeat partners.

**Backend**

```sql

rotations (id, session_id, regular_group_id, algorithm, config jsonb, created_at)

rotation_courts (rotation_id, court_number, player_ids uuid[])

rotation_history (regular_group_id, user_a, user_b, session_id) -- avoid repeats

```

- RPC `generate_rotation(session_id, config)`:

- Input: committed roster, skill tags optional, court count.

- Algorithm v1: greedy pair assignment minimizing repeat partners.

- Store result; broadcast via Realtime or poll.

- RLS: Rally members read; host generates.

**Client**

- On locked session card: **Generate rotation**.

- Display courts as scrollable rows; manual drag-to-swap (v1.1).

- "Next round" regenerates keeping history.

**Rollout**

- Feature flag `rotation_v1` per sport.

- Captains badminton/pickleball first; tune `config` defaults from feedback.

**Validation:** Used on ≥25% of locked badminton/pickleball sessions.

---

## 1.4 Mini Tournament

**Status:** [x] Shipped · `029` + `MiniTournamentScreen` · `mini_tournament_v1` flag on

**User outcome:** One-night round robin, king/queen of court, or ladder inside a Rally session.

**Backend**

```sql

tournaments (id, session_id, regular_group_id, format enum, status)

tournament_matches (id, tournament_id, round, court, team_a, team_b, score_a, score_b)

tournament_standings (tournament_id, user_id, wins, losses, points)

```

- RPCs: `create_tournament(session_id, format)`, `report_match_score`, `advance_king_queen_round`, `get_standings`.

- Formats v1:

- `king_queen` — winners stay, split losers

- `round_robin` — small N only (≤8)

- `random_doubles` — reuse rotation engine + W/L

**Client**

- Session card → **Start mini tournament** (host, after lock).

- Match cards in thread or modal; tap to enter score.

- Standings tab on session.

**Rollout**

- Flag `mini_tournament_v1`; captain Rallies + one founder test Rally.

- Sport template picks default format (badminton → king/queen).

**Validation:** One full tourney completed end-to-end in QA; shareable standings snapshot.

---

## 1.5 In-Group Leaderboard

**Status:** [x] Shipped · `038_rally_leaderboard.sql` · `leaderboard_v1` flag on

**User outcome:** Rally members see attendance streaks, games played, tourney W/L — group only.

**Backend**

- View or RPC `get_rally_leaderboard(regular_group_id, window)` aggregating:

- Sessions attended (post attendance)

- Current streak (weeks with ≥1 attended session)

- Tournament wins/losses if 1.4 shipped

- No cross-Rally or public rank in v1.

**Client**

- Rally info screen tab: **Leaderboard**.

- Optional pin top 3 in chat once per week (system message).

**Rollout:** All Rallies once attendance stable.

**Validation:** Leaderboard loads <500ms; numbers match manual count for test Rally.

---

# Phase 2 — After-Game & Practical Info

## 2.1 Post-Game Recap

**Status:** [x] Shipped · `039` · auto-post on attendance · `Share` text recap (PNG later)

**User outcome:** After attendance, chat gets recap card; user can share image off-app.

**Backend**

- RPC `generate_recap(session_id)` builds JSON: attendees, MVP placeholder (host pick optional), streak highlights, courts used.

- Store `recaps(session_id, payload, created_at)`.

- Edge function optional: render share image (or client-side RN view shot).

**Client**

- Auto-post recap system message in Rally chat after host submits attendance.

- **Share recap** → PNG with Rally name + stats.

**Rollout:** All completed sessions.

**Validation:** Share sheet works iOS + Android; recap matches attendance.

---

## 2.2 Court / Venue Info

**Status:** [x] Shipped · extended `activity_locations` · `VenueBlock` · crew default court

**User outcome:** Session shows venue block: address, parking, cost, hours, booking link, busy notes.

**Backend**

```sql

venues (id, name, address, geo, parking_note, cost_note, hours jsonb, booking_url, busy_notes)

regular_group_venues (regular_group_id, venue_id, is_default)

activity.venue_id nullable FK

```

- Seed LA badminton/pickleball venues (manual CSV migration).

- RPC `get_venue(venue_id)`; RLS public read for beta venues.

**Client**

- Session create: pick venue (default from Rally).

- Session card + detail: venue block with maps deep link.

- Rally settings: set default venue.

**Rollout:** Seeded venues for LA; captains can request adds via form (manual insert until admin UI).

**Validation:** Map link opens; default venue pre-fills new sessions.

---

## 2.3 Payment Handle in Profile

**Status:** [x] Shipped · `040_nudge_payment_handle.sql` · Profile Payments section · `HostPaymentHint` (game room + activity detail; not Discover)

**User outcome:** Profile shows Venmo/Zelle/cash note; optional per-session fee hint.

**Backend**

- Extend `profiles`: `payment_note text`, `preferred_payment app enum optional`.

- RLS: owner edit; other members read in Rally context only (or public in beta).

**Client**

- Profile edit: Payment section.

- Session card footer: "Court fee ~$X — see host payment" linking host profile.

**Rollout:** Immediate; no processing.

**Validation:** Payment note visible to Rally mates; not exposed on public Discover if policy says so.

---

## 2.4 Social Proof on Profile

**User outcome:** Profile shows games played, hosted, streak, reliability badge, Partner badge.

**Backend**

- Extend profile stats view (same sources as 0.5 + 2.1).

- `badges` table optional v1: enum + earned_at on profile.

**Client**

- Profile sports card component.

- Small badges on Discover join requests (reliability only in v1).

**Rollout:** Progressive — streak after 2 weeks data.

**Validation:** Stats match DB aggregates for test users.

---

# Phase 3 — Host Tools

## 3.1 Reuse Last Game + Schedule Next

**User outcome:** Host duplicates last session (time offset +1 week, same venue/roster invite list).

**Backend**

- RPC `duplicate_session(source_session_id, new_starts_at)` copies settings, pre-notifies prior attendees via push.

**Client**

- Session card overflow: **Run again next week**.

- Home host CTA: **Schedule next**.

**Validation:** Duplicate creates one new session; no duplicate chat spam.

---

## 3.2 Nudge Non-Responders

**Status:** [x] Shipped · `040` · `nudge_v1` flag · `CrewGameSessionCard` + `GameRoomActionBar` · push `roster_nudge`

**User outcome:** Host taps Nudge; members who joined but not I'm in get push + in-app.

**Backend**

- RPC `nudge_session(session_id)` — rate limit 1/user/24h; inserts notification rows.

- Push via existing notification pipeline.

**Client**

- Host button on session card when `joined > im_in`.

- Member sees: "Host is locking roster — tap I'm in."

**Validation:** Rate limit enforced; only eligible users notified.

---

## 3.3 Invite Previous Players

**User outcome:** Host invites past attendees or whole Rally to new session.

**Backend**

- RPC `invite_to_session(session_id, user_ids[])` or reuse Rally membership + @mention push.

**Client**

- Session create: toggle **Notify all Rally members**.

- Pick from past attendees list.

**Validation:** Push received; deep link opens session card.

---

## 3.4 Auto-Fill from Public Pool

**User outcome:** Host with open spots pulls from Need Players matches (Phase 4.2).

**Backend**

- RPC `suggest_fill_ins(session_id)` reads open spots + Need Players board proximity/sport.

- Host approves; sends join invites.

**Client**

- Session card when spots open: **Find players**.

- Requires 4.2 live.

**Rollout:** Captain hosts first.

**Validation:** Stranger accept → join → I'm in flow works.

---

# Phase 4 — Liquidity & Matching

## 4.1 Sport Captain Program

**Status:** [x] Shipped · `041_captains_need_players.sql` · `captain_program_v1` · Profile apply · Admin approve · `PartnerRallyBadge`

**User outcome:** Approved captains link a Partner Rally; whole group gets perks; captain gets host tools + feedback channel.

**Backend**

```sql

captains (id, user_id, sport, city, sub_market, status, rally_id FK, approved_at)

captain_applications (...)

```

- Admin RPC or dashboard: approve, link `regular_group_id`.

- Flag on Rally: `is_partner_rally boolean`.

- Analytics events: `captain_application`, `partner_rally_session`.

**Client**

- Apply flow: sport, city, typical game, optional Rally link.

- Partner badge on Rally header + profile.

- In-app release notes channel per sport (can start as Notion/Discord link).

**Ops (manual v1)**

- Google Form → Airtable → founder approve → SQL update.

- Monthly Zoom per sport; captains submit friction form after each hosted session.

**Validation:** Layer 1 perks visible to all Rally members on link; captain badge on host only.

---

## 4.2 Need Players Board

**Status:** [x] Shipped · `041` · `need_players_v1` · Discover **Need players** mode · `NeedPlayerPostCard` · game room post + accept

**User outcome:** Host posts open spots; strangers or free agents request to join.

**Backend**

```sql

need_player_posts (id, session_id or host_user_id, sport, spot_count, skill_level, venue_id, starts_at, status)

need_player_requests (post_id, user_id, message, status pending|accepted|declined)

```

- RPCs: `create_need_post`, `list_need_posts(city, sport)`, `request_spot`, `respond_request`.

- RLS: public read posts in beta cities; authenticated request; host responds.

- Tie to Public game or Rally session when filled.

**Client**

- Discover tab subsection: **Need players** (or filter on Discover).

- Create from session card: **Post open spots**.

- Request flow → host approve → normal Join/I'm in.

**Rollout:** LA badminton + pickleball only; captain hosts seed first posts.

**Validation:** Request → approve → roster includes new player.

---

## 4.3 Free Agent Board

**Status:** [x] Shipped · `042_free_agents_landing.sql` · `free_agents_v1` · Profile post · Discover tab · game room invite

**User outcome:** Player posts availability; hosts invite them.

**Backend**

```sql

free_agent_posts (id, user_id, sport, city, availability jsonb, skill, note, expires_at)

free_agent_invites (post_id, host_user_id, session_id, status)

```

- RPCs: `create_free_agent_post`, `list_free_agents`, `invite_free_agent`.

- Match scoring v1: same sport + city + overlapping time windows.

**Client**

- Discover: **Free agents** list + create post from profile.

- Host sees suggested agents on 3.4 / Need Players.

**Rollout:** After 4.2 stable (hosts before agents).

**Validation:** Invite → user accepts → joins session.

---

## 4.4 Manual Concierge Matching

**User outcome:** Founder manually connects player ↔ host when boards are thin.

**Ops playbook**

1. Intake form (sport, level, area, times).

2. Search Need Posts + captains in Airtable/Supabase admin query.

3. WhatsApp/iMessage intro → deep link to Public game or Rally session.

4. Log outcome in spreadsheet → weekly metric.

**Backend (minimal)**

- `concierge_requests` table for tracking only; no user-facing v1 required.

**Validation:** Time to first game <7 days for concierge cases.

---

## 4.5 City + Sport Landing Pages

**Status:** [x] Shipped · `get_sport_landing_payload` · in-app `SportLandingScreen` · `rallyapp://la/{sport}` · edge `sport-landing` HTML

**User outcome:** Shareable URL: `rally.app/la/badminton` with value prop + open games + captain faces.

**Backend**

- Static site or Supabase edge SSR reading open `need_player_posts` + featured captains.

- Deep links into app (Universal Links).

**Client**

- App Store / TestFlight CTA; open Discover filtered.

**Rollout:** One page per active sport in LA.

**Validation:** Analytics on link → install → first session funnel.

---

# Phase 5 — Partners & Seeding

## 5.1 Venue Partner Profiles

**Status:** [x] Shipped · `043` · `activity_locations.partner_tier` · `VenueBlock` + `GameCard` badge · partner filter on Play

**User outcome:** Venue has branded page; sessions can tag venue; booking link prominent.

**Backend**

- Extend `venues` with `partner_tier`, `logo_url`, `promo_note`.

- Admin seed partners; optional `venue_admins` for future self-serve.

**Client**

- Venue detail screen from 2.2.

- Discover filter: games at partner venues.

**Validation:** Partner venue shows on ≥N sessions/month.

---

## 5.2 Coach / Clinic Listings

**Status:** [x] Shipped · `043` · seeded LA listings · `CoachesCarousel` on Discover

**User outcome:** Coaches list clinics; link to Public games or external booking.

**Backend**

```sql

coach_listings (id, name, sport, venue_id, schedule_note, booking_url, city)

```

- Read-only v1; curator adds rows.

**Client**

- Discover: **Coaches & clinics** carousel.

**Rollout:** 2–3 LA partners manual.

---

## 5.3 Seed Rally-Hosted Intro Games

**Status:** [x] Shipped · `is_intro_session` · host toggle on create · Play/landing list · Admin intro calendar (`admin_set_intro_session`)

**User outcome:** Founder + captains run recurring intro nights for strangers.

**Ops**

- Weekly calendar: captain hosts, founder boosts Need Post, concierge fills.

- Use Public game type for strangers; optional merge into Partner Rally after 2 sessions.

**Validation:** New users from intro → second session rate.

---

# Phase 6 — Sport-by-Sport Expansion

## 6.1 Sport Config Templates

**Status:** [x] Shipped · `043` · `sport_templates` for Badminton/Pickleball/Basketball · Create Game reads `get_sport_template`

**User outcome:** Badminton defaults ≠ soccer defaults for roster size, rotation, tourney formats.

**Backend**

```sql

sport_templates (sport, default_roster, rotation_config jsonb, tourney_formats[], venue_fields[])

regular_groups.sport_template_id

```

- RPCs read template when creating session / rotation / tourney.

**Client**

- Session create uses template defaults.

- Captain feedback form maps to template keys.

**Process**

- Captain monthly sync → JSON tweak → migration or admin update → release note.

---

## 6.2 Captain Feedback → Sport Upgrade Backlog

**User outcome:** Captains see their sport requests shipped.

**Ops**

- Form fields: sport, feature area, friction 1–5, note, session link.

- Linear/Notion board tagged by sport; ship notes credit captains.

**Validation:** ≥1 template change per sport per quarter from captain input.

---

## 6.3 Second City Expansion

**User outcome:** New city gated same as LA playbook.

**Checklist before expand**

- Phase 1–2 retention metrics hit in LA.

- ≥3 captains per core sport in LA.

- Need Players + concierge playbook documented.

- Repeat 4.1, 4.2, 4.5 for new city.

---

# Cross-Cutting Execution

## Feature Flags

| Flag | Features |

|---|---|

| `poll_v1` | 1.2 |

| `rotation_v1` | 1.3 |

| `mini_tournament_v1` | 1.4 |

| `need_players_v1` | 4.2 |

| `free_agents_v1` | 4.3 |

| `fill_ins_v1` | 3.4 |

Store in `profiles.beta_flags` or remote config table; founder override in SQL.

## Analytics Events (Minimum)

- `session_created`, `session_locked`, `attendance_submitted`

- `poll_created`, `poll_voted`, `rotation_generated`, `tournament_started`

- `recap_shared`, `need_post_created`, `free_agent_invited`, `fill_in_invited`

- `captain_application_submitted`, `partner_rally_session`, `concierge_request_submitted`, `captain_feedback_submitted`

## Migration Discipline

- One migration per feature vertical; numbered after 032.

- Every RPC: `security definer` + explicit RLS checks; host-only paths verified in tests.

- Ship UI behind flag before default-on.

## QA Matrix (Every Release)

| Flow | Device A | Device B |

|---|---|---|

| Poll → session | voter | host |

| Rotation | host | member sees courts |

| Tournament score | host | member sees standings |

| Need player request | stranger | host accept |

| Recap share | host | member view |

---

# Suggested Build Sprints

| Sprint | Focus | Ship |

|---|---|---|

| S1 | 1.1 + 1.2 | Session polish + availability poll · **done** |

| S2 | 1.3 | Rotation generator (badminton/pickleball) · **done** |

| S3 | 1.4 + 1.5 | Mini tournament + leaderboard · **done** |

| S4 | 2.1 + 2.2 | Recap + venue block · **done** |

| S5 | 3.2 + 2.3 | Nudge + payment handle · **done** |

| S6 | 4.1 + 4.2 | Captains + Need Players · **done** |

| S7 | 4.3 + 4.5 | Free agents + landing pages · **done** |

| S8 | 5.x + 6.1 | Partners + sport templates · **done** |

| S9 | 3.4 + 4.4 + 6.2 | Auto-fill + concierge intake + captain feedback · **done** |

| S10 | 4.4 + 5.3 | Concierge match picker + intro night admin calendar · **done** |

| S11 | 1.1 | `get_session_card_payload` · crew/chat session cards · lock + ready polish · **done** |

---

_Last updated: 2026-06-02_
