# Advisor implementation plan — execution track

**Sources:** `ADVISOR_AGENT_UPDATE_2026-06-02.md` (advisor review), `IMPLEMENT_PLAN.md` (locked semantics).  
**Signed off:** 2026-06-02 — **Track A (A0–A6)** semantics. **A7 deferred** (unified public-as-Rally model).

**Build sign-off:** 2026-06-02 — Phases **0, 2, 4** engineering **complete** (QA pending). Migration **032** applied to linked Supabase (`casljueycxsqexpkdiuq`) via `supabase db query -f … --linked`.

Use this doc to **track build vs QA**. Decision detail lives in `IMPLEMENT_PLAN.md`. Collective QA → `QA_BETA_CREW_CHECKLIST.md`, `QA_BUILD_HANDOFF.md`.

> **Signed off ≠ every sub-task shipped.** Track A **locks product rules** (A2 guests, A6 legacy). **Engineering** may defer sub-tasks (see A2 Phase 3, A6-3/4) without reopening semantics.

---

## Track A — Semantics (signed off)

| ID | Topic | Status | Where defined |
|----|--------|--------|----------------|
| **A0** | Execute advisor pivot; Track A gates Phase 1+ | ✅ Signed off | This doc + advisor §0–5 |
| **A1** | Naming: **Rallys** / **Start a Rally** | ✅ Signed off | `IMPLEMENT_PLAN.md` §A1 |
| **A2** | Public game vs Rally game; guest scoped chat | ✅ Signed off | `IMPLEMENT_PLAN.md` §A2 |
| **A3** | Join / I'm in / lock; kick; no auto-penalty for join-only | ✅ Signed off | `IMPLEMENT_PLAN.md` §A3 |
| **A4** | Rally pin + **`session_note`** per session | ✅ Signed off | `IMPLEMENT_PLAN.md` §A4 |
| **A5** | Reliability v1 formula + confidence bands | ✅ Signed off | `IMPLEMENT_PLAN.md` §A5 |
| **A6** | Legacy RSVP / hide old per-activity crew chats | ✅ Signed off | `IMPLEMENT_PLAN.md` §A6 |
| **A7** | Every public game = ephemeral Rally | ⏸ **Deferred** | `IMPLEMENT_PLAN.md` §A7 — ADR only, no build |

**Glossary (locked):** see `IMPLEMENT_PLAN.md` → Glossary.

> **Nothing from the gap review was dropped.** Items below (B–G) are the same backlog, mapped to **Phase 0–5** and ticket IDs. If you only read phases, use this section as the master index.

---

## Master backlog (advisor gap review → this doc)

### B — Must do now (advisor §5.1)

| ID | Item | Status | Phase / task |
|----|------|--------|----------------|
| **B1** | Rallys copy everywhere (was “Regulars/Crew”) | **Done** ✅ | `productCopy.ts` + main surfaces |
| **B2** | Dynamic Home as main hub | **Done** ✅ | `DynamicHomeScreen` + `useHomeDashboard` |
| **B3** | Home cards: Next Up, Active Rallys, needs commitment, host schedule, public near you | **Done** ✅ | HOME-01–03 |
| **B4** | Session cards in Rally chat | **Done** ✅ | `CrewGameSessionCard` / `CrewChatSessionList` |
| **B5** | “I'm in” stronger than Join | **Done** ✅ | Glossary + game room + session cards |
| **B6** | Clear locked roster state | **Done** ✅ | Detail, Game Room, cards |
| **B7** | Public one-offs unchanged | **Done** ✅ | Join request + `activity_group` |
| **B8** | Legacy chat migration plan | **Partial** ✅ | A6-1–2 done (032); A6-3–4 deferred |
| **B9** | iOS clean build | **QA** | IOS-01 runbook §12 — rebuild in progress |

### C — Should do soon (advisor §5.2)

| ID | Item | Status | Phase / task |
|----|------|--------|----------------|
| **C1** | Session-level announcements (`session_note`) | **Done** ✅ | 032 + detail + session cards |
| **C2** | Waitlist when full | **Done** ✅ | `join_crew_game` jsonb + UI alerts |
| **C3** | Post-game attendance (§6.8) | **Done** ✅ | `PostGameAttendanceScreen` |
| **C4** | Reliability v1 | **Done** ✅ | RPC + profile + `PlayerTrustLine` |
| **C5** | Host summary dashboard | **Done** ✅ | Dynamic Home host card |
| **C6** | “Bring Rally to your group” CTA | **Done** ✅ | Dynamic Home |
| **C7** | LA badminton/pickleball beta copy | **Done** ✅ | `BetaMarketBanner` |
| **C8** | Founding Member copy | **Done** ✅ | Profile / beta copy |

### D — UI screens (advisor §6)

| Screen | Status | Gaps | Phase / task |
|--------|--------|------|----------------|
| **6.1** Dynamic Home | **Done** ✅ | QA empty states on device | **HOME-01–03** |
| **6.2** Discover | **QA** | Filters polish optional | **DISC-01** deferred polish |
| **6.3** Host / Create | **Done** ✅ | Public default + Rally link | **CREATE-01** |
| **6.4** Activity / session | **Done** ✅ | Labels, session note, kick, attendance CTA | **A3**, **A4** |
| **6.5** Rally chat | **Done** ✅ | QA multi-session | **QA-07** |
| **6.6** Chats inbox | **Done** ✅ | Legacy hide (032) | **QA-09** |
| **6.7** Rally profile | **QA** | Multi-sport later | **CREW-01** partial |
| **6.8** Post-game attendance | **Done** ✅ | **POST-01** |
| **6.9** Admin / safety | **QA** | Existing admin screen | **QA-10** |

### E — Test checklist (advisor §8) → QA plan

**Not left behind** — split into **QA-01–QA-11** in Phase 1/4. Use advisor doc §8 as the script; track in a spreadsheet.

| Priority | Sections | Task IDs |
|----------|----------|----------|
| **P0** | 8.6–8.7 crew loop | QA-06, QA-07 |
| **P0** | 8.3 Discover unchanged | QA-03 |
| **P0** | 8.13 DB/RLS | QA-08 |
| **P1** | 8.4–8.5 Rally create/schedule | QA-04, QA-05 |
| **P1** | 8.1–8.2 Auth + Home | QA-01, QA-02 |
| **P2** | 8.8–8.10 announcements, inbox, push | A4-4, QA-09, PUSH-01 |
| **P2** | 8.11–8.12 Admin, runtime | QA-10, QA-11 |

### F — Already shipped (do not re-build)

| Item | Notes |
|------|--------|
| `crew_group`, `conversation_activities`, `join_crew_game`, `schedule_group_next_game` | Migration 030 |
| RSVP bar removed; inbox dedupe for Rally games | Client + 030 |
| `get_inbox_message_previews`, roster sync trigger | Migration 031 |
| `profiles.timezone` column | 031 — UI still **TZ-01** |
| Mini tournament MVP skeleton | 029 + screens — polish = **TOUR-01** (Phase 5) |
| PR #4 merged `dev` → `preview` | Crew restructure |

### G — Explicitly delay (advisor §5.3 / §10)

| Item | Status |
|------|--------|
| Full Teams, Leagues, payments, media chat | Phase 5 **TEAMS-01**, **LEAGUE-01**, **PAY-01** |
| City expansion outside LA | Deferred |
| Public rankings, complex brackets | Deferred |
| **A7** unified public-as-Rally model | **ADR-01** ⏸ deferred |

---

## Ticket index (gap review “open next” → mapped)

| Ticket | Description | Status | Where |
|--------|-------------|--------|--------|
| **COPY-01** | Glossary: Rally / session / public game / I'm in / lock | [x] ✅ | `ProductGlossarySheet` |
| **ADR-01** | Public game = one-session Rally? | ⏸ Deferred | **A7** — no build |
| **ANN-01** | Rally pin + `session_note` | [x] ✅ | 032 + UI (crew pin = existing) |
| **REL-01** | Reliability v1 view + soft profile copy | [x] ✅ | `get_user_attendance_stats` |
| **HOME-01** | Dynamic Home cards (§5.1 / §6.1) | [x] ✅ | |
| **LEGACY-01** | Archive `activity_group`; inbox safety | [~] ✅ | A6-1–2 done; A6-3–4 deferred |
| **QA-01** | Full §8 beta run on preview | [ ] | **Your collective QA** |
| **IOS-01** | Local build runbook | [x] ✅ | §12; device sign-off = QA-11 |
| **WAIT-01** | Session waitlist | [x] ✅ | |
| **POST-01** | Post-game attendance UI | [x] ✅ | |
| **HOST-01** | Host summary dashboard | [x] ✅ | |
| **CREATE-01** | Public vs Rally chooser | [x] ✅ | |
| **TZ-01** | Profile timezone | [x] ✅ | |

---

## Progress overview

| Phase | Focus | Status |
|-------|--------|--------|
| **0** | Copy + glossary (B1, COPY-01) | **Done** ✅ — QA only |
| **1** | Stabilize (B8–B9, LEGACY-01, QA-01–08) | **Build done** — QA-01–11 pending |
| **2** | Session announcements + commitment (A3–A5, A4) | **Done** ✅ — QA §8.6–8.8 |
| **3** | Guests (A2 engineering) | **Deferred** ⏸ — semantics signed off |
| **4** | Home & retention polish | **Done** ✅ — QA §6 |
| **5** | Retention + compete (TOUR-01; G deferred) | Not started |

---

## Phase 0 — Copy & glossary

Depends on **A1 ✅**. No dependency on A7.

| ID | Task | Status | Notes |
|----|------|--------|-------|
| A1-2 | UI copy pass: Rallys, Start a Rally; remove Crew/Regulars in user strings | [x] ✅ | Main surfaces |
| A1-3 | Add `src/constants/productCopy.ts` | [x] ✅ | `src/constants/productCopy.ts` |
| A2-1 | Public vs Rally game explainer copy | [x] ✅ | Create + Activity detail |
| COPY-01 | Glossary doc link in app (optional FAQ sheet) | [x] ✅ | `ProductGlossarySheet` |

---

## Phase 1 — Stabilize & validate

Advisor §9 Step 1 + §8 QA. Parallel with Phase 0.

| ID | Task | Status | Ref |
|----|------|--------|-----|
| IOS-01 | iOS local build runbook; `NODE_BINARY`; clean rebuild | [x] | `current-setup-app-guide.md` §12 |
| QA-01 | §8.1 Auth/onboarding smoke | [ ] | Collective QA |
| QA-02 | §8.2 Dynamic Home routing | [ ] | Collective QA |
| QA-03 | §8.3 Discover one-off (join request unchanged) | [ ] | Collective QA |
| QA-04 | §8.4 Rally creation from game | [ ] | Collective QA |
| QA-05 | §8.5 Schedule session → same chat | [ ] | Collective QA |
| QA-06 | §8.6 Join / I'm in / Lock roster | [ ] | Collective QA |
| QA-07 | §8.7 Multi-session same Rally | [ ] | Collective QA |
| QA-08 | §8.13 DB/RLS (030/031/032 on preview) | [~] | 032 applied 2026-06-02; verify RPCs in QA |
| REL-01 | Confirm preview migrations + seed | [x] ✅ | 032 via `supabase db query --linked` |
| REL-02 | EAS preview rebuild (icon/splash) | [ ] | Post-QA if needed |
| REL-03 | Hide dev diagnostics in preview builds | [x] ✅ | `devFlags.ts` gates panels |

### Legacy (A6 — start in Phase 1)

| ID | Task | Status | Ref |
|----|------|--------|-----|
| A6-1 | Archive/deactivate legacy `activity_group` for crew-linked activities | [x] ✅ | 032 backfill |
| A6-2 | Inbox: no duplicate Rally + game rows | [x] ✅ | 030/031 + verify in QA |
| A6-3 | Optional message merge into `crew_group` | ⏸ Deferred | Per IMPLEMENT_PLAN — risky |
| A6-4 | Drop `activity_rsvps` after analytics OK | ⏸ Deferred | Post-analytics |

---

## Phase 2 — Session announcements + commitment

Depends on **A3 ✅, A4 ✅, A5 ✅**.

### A4 — Announcements

| ID | Task | Status | Ref |
|----|------|--------|-----|
| A4-1 | Migration: `activities.session_note` + `set_session_note` RPC | [x] ✅ | 032 |
| A4-2 | Show `session_note` on session card, detail, Game Room | [x] ✅ | |
| A4-3 | Host edit: Rally pin in chat; session note on schedule/edit | [x] ✅ | Detail host edit |
| A4-4 | QA §8.8: pins don't bleed across sessions | [ ] | Collective QA |

### A3 — Commitment & host tools

| ID | Task | Status | Ref |
|----|------|--------|-----|
| A3-1 | Tooltips: Join vs I'm in vs Locked | [x] ✅ | Glossary + copy |
| A3-2 | RPC `request_roster_confirmation` + notification | ⏸ Deferred | Optional v1 |
| A3-3 | RPC host kick / `remove_from_roster` pre-lock; chat `is_active` | [x] ✅ | Game Room long-press |
| A3-4 | Reliability: no record join-only / pre-lock / never I'm in at lock | [x] ✅ | A5 RPC rules |
| A3-5 | UI: host roster actions; “Host asked you to confirm” | [~] | Kick done; confirm push deferred |
| A3-6 | Leave-game copy: pre-lock vs post-lock | [x] ✅ | Existing leave flow |

### A5 — Reliability v1 (display)

| ID | Task | Status | Ref |
|----|------|--------|-----|
| A5-1 | View/RPC `user_attendance_stats` | [x] ✅ | 032 |
| A5-2 | Profile + `PlayerTrustLine`: bands, soft copy | [x] ✅ | |
| A5-3 | Wire post-game → `confirmed_attended` | [x] ✅ | POST-01 |
| A5-4 | Anti-gaming / dispute path | ⏸ Deferred | Later |

### Advisor §5.1 — Must do (engineering)

| ID | Task | Status | Shipped? |
|----|------|--------|----------|
| B4 | Session cards in Rally chat | [x] | `CrewGameSessionCard` |
| B5 | “I'm in” stronger than Join | [x] ✅ | |
| B6 | Clear locked roster state | [x] ✅ | |
| B7 | Public one-offs unchanged | [x] ✅ | |
| B1 | Rallys copy everywhere | [x] ✅ | |
| B2 | Dynamic Home main hub | [x] ✅ | |
| B3 | Home cards per wireframe §6.1 | [x] ✅ | |
| B8 | Legacy chat migration plan | [~] ✅ | A6-3–4 deferred |
| B9 | iOS clean build | [ ] | QA-11 on device |

---

## Phase 3 — Guests (A2)

**Semantics signed off** (`IMPLEMENT_PLAN` §A2). **Engineering deferred** to post–collective QA (does not block member Rally loop).

| ID | Task | Status | Ref |
|----|------|--------|-----|
| A2-2 | Guest invite by username | ⏸ Deferred | Phase 3 |
| A2-3 | DB: `is_guest` / `participant_type` on join; multi-activity | ⏸ Deferred | |
| A2-4 | RLS: guest message scope by `activity_id` | ⏸ Deferred | |
| A2-5 | `ChatThreadScreen` filter; hide crew-wide for guests | ⏸ Deferred | |
| A2-6 | Inbox: guest → session row; member → Rally row | ⏸ Deferred | |
| A2-7 | QA: guest isolation | ⏸ Deferred | After A2-2–6 |
| A2-8 | QA: guest on two sessions same Rally | ⏸ Deferred | |

---

## Phase 4 — Home & retention polish

Advisor §5.2 + §6 screens.

| ID | Task | Status | Ref |
|----|------|--------|-----|
| HOME-01 | Dynamic Home: Next Up, needs commitment, host schedule, public near you | [x] ✅ | §6.1 |
| HOME-02 | Empty/new user LA beta positioning | [x] ✅ | Explorer copy + banner |
| HOME-03 | Host “Roster to lock” card | [x] ✅ | |
| CREATE-01 | Host flow: public vs “My Rally” chooser (§6.3 wireframe) | [x] ✅ | |
| DISC-01 | Discover filters + empty host CTA | ⏸ Deferred | Polish post-QA |
| CREW-01 | Rally profile/home: members + reliability labels (§6.7) | [~] | Partial — QA |
| POST-01 | Post-game attendance screen (§6.8) | [x] ✅ | |
| WAIT-01 | Waitlist when session full | [x] ✅ | |
| C6 | “Bring Rally to your group” CTA → contact | [x] ✅ | |
| C7 | LA badminton/pickleball beta copy alignment | [x] ✅ | |
| C8 | Founding Member copy expansion | [x] ✅ | |
| C1 | Session announcements (`session_note`) | [x] ✅ | |
| C2 | Waitlist | [x] ✅ | |
| C4 | Reliability v1 (if not closed in Phase 2) | [x] ✅ | |
| C5 | Host summary dashboard | [x] ✅ | |
| TZ-01 | `profiles.timezone` in Profile settings | [x] ✅ | |
| PUSH-01 | §8.10 push matrix on physical devices | [ ] | Collective QA |

### QA — remaining §8

| ID | Task | Status |
|----|------|--------|
| QA-09 | §8.9 Inbox previews / unread | [ ] |
| QA-10 | §8.11 Admin / safety | [ ] |
| QA-11 | §8.12 iOS/Android runtime sign-off | [ ] |

---

## Phase 5 — Compete & ideas (deferred / post-beta)

Advisor §5.3 + founder ideas. **Not** until Phase 2 validated with real users.

| ID | Task | Status | Notes |
|----|------|--------|-------|
| A7-1 | ADR: ephemeral Rally per public game | ⏸ | **Deferred** with A7 |
| TOUR-01 | Mini tournament polish (round robin, scores) | [ ] | Skeleton exists |
| MULTI-01 | Rally supports multiple sports (badminton + pickleball) | [ ] | Today: single `sport_type` |
| LEAD-01 | Group leaderboard by sport / session history | [ ] | Idea only |
| TEAMS-01 | Full Teams | ⏸ | §5.3 |
| LEAGUE-01 | Full Leagues | ⏸ | §5.3 |
| PAY-01 | Payments / fee split | ⏸ | §5.3 |

---

## Screen checklist map (advisor §6)

Quick map from wireframes → phase. Full acceptance in advisor doc §6 checklists.

| Screen | Phase | Primary IDs |
|--------|-------|-------------|
| 6.1 Dynamic Home | 4 | HOME-01–03, B3 |
| 6.2 Discover | 4 | DISC-01 |
| 6.3 Host / Create | 4 | CREATE-01 |
| 6.4 Activity / session | 2, 4 | A3, A4, B5–B6 |
| 6.5 Rally chat | 2 | A4, B4 ✅ |
| 6.6 Chats inbox | 1, 3 | A6-2, A2-6 |
| 6.7 Rally profile | 4 | CREW-01 |
| 6.8 Post-game attendance | 4 | POST-01, A5-3 |
| 6.9 Admin / safety | 1 | QA-10 |

---

## Already shipped (do not re-build)

- `030` / `031` crew chat migrations
- One `crew_group` per Rally; `conversation_activities` + session cards
- `join_crew_game`; crew path for I'm in / Lock roster
- RSVP bar removed; inbox dedupe for Rally-linked games
- `get_inbox_message_previews`; mini tournament MVP skeleton
- PR #4 merged `dev` → `preview` (crew restructure)

---

## Related docs

| Doc | Role |
|-----|------|
| `IMPLEMENT_PLAN.md` | **Locked decisions** A1–A6, guest model, glossary |
| `ADVISOR_AGENT_UPDATE_2026-06-02.md` | Advisor review + wireframes + §8 QA scripts |
| `NEXT_ITEMS.md` | Engineering backlog from architecture review |
| `current-setup-app-guide.md` | iOS/Android local run (§12 IOS-01) |
| `docs/QA_BETA_CREW_CHECKLIST.md` | Phase 1–2 manual QA script |

---

## Advisor build order

### §9 original (June 2) — engineering status

| Advisor step | Our phases | Status |
|--------------|------------|--------|
| Step 1 Stabilize | **1** | **Now** — QA, EAS, runtime |
| Step 2 Validate crew pivot | **2** QA | **Now** — §8.4–8.7 |
| Step 3 Fix semantics | **0** | **Done** ✅ Track A |
| Step 4 Dynamic Home | **4** | **Done** ✅ |
| Step 5 Attendance/reliability | **2–4** | **Done** ✅ |
| Step 6 Mini tournaments | **5** | Skeleton only — after replay gate |

### Updated sequence (June 3 review) — **current focus**

See [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md) §1–4.

Stabilize runtime → Validate Public + Rally (2 devices) → Data invariants → Polish Home → Confirm attendance → Query replay % → Guests vs LA hosts.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-02 | Created execution track; A0–A6 signed off; A7 deferred |
| 2026-06-02 | Added master backlog B–G + ticket index (gap review merge) |
| 2026-06-02 | Started Phase 0–1: productCopy, copy pass, IOS-01, QA checklist |
| 2026-06-02 | **Build sign-off:** Phases 0, 2, 4 complete; 032 applied to Supabase; collective QA next |
