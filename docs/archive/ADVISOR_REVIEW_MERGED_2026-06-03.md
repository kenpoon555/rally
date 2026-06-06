# Advisor review merged with Rally repo state

> **Superseded for planning:** use **[PRODUCT_DIRECTION.md](./PRODUCT_DIRECTION.md)** + **[archive/SHIPPED_AND_DEFERRED_2026-06.md](./archive/SHIPPED_AND_DEFERRED_2026-06.md)**. This file is historical reference only.

**Last updated:** 2026-06-03  
**Sources:** External advisor review (2026-06-03), `ADVISOR_AGENT_UPDATE_2026-06-02.md`, `IMPLEMENT_PLAN.md`, `ADVISOR_IMPLEMENTATION_PLAN.md`, `WHAT_NEXT.md`, `open_items.md` (parent folder).

**Verdict (advisor + repo agree):** Good place for **closed beta**. Do **not** add scope this week. **Bulletproof** = reliable, low-latency, understandable loop — not every feature on the long roadmap.

---

## 1. Two build-order views (reconciled)

### Advisor original sequence (June 2 doc §9)

| Step | Advisor label | Repo status |
|------|---------------|-------------|
| 1 | Stabilize runtime | **In progress** — QA-11, EAS preview, iOS runbook |
| 2 | Validate crew-first session flow | **QA pending** — §8.6–8.7 checklist |
| 3 | Finalize product semantics | **Done** — Track A A0–A6 signed off |
| 4 | Add Dynamic Home | **Done** — `DynamicHomeScreen`, `useHomeDashboard` |
| 5 | Attendance / reliability | **Done** — 032 + post-game + profile line |
| 6 | Mini tournaments | **Skeleton shipped** — polish = TOUR-01, **after** replay gate |

### Advisor updated sequence (June 3 review)

| Order | Focus | Maps to repo |
|-------|--------|--------------|
| 1 | **Stabilize runtime** | Phase 1: QA-11, preview build, fix P0 bugs, no new features |
| 2 | **Validate Public + Rally on two devices** | `QA_BETA_CREW_CHECKLIST.md` §8.3 + §8.4–8.7 |
| 3 | **Lock down data invariants** | RPCs in Postgres; RLS; 032 applied; monitor roster trigger |
| 4 | **Polish Home state logic** | Host lock card, ready vs needs players (recent fixes); QA empty states |
| 5 | **Confirm attendance / reliability** | End-to-end: lock → play → host marks attendance → profile % |
| 6 | **Query replay %** | `analytics_crew_lifecycle.retained` |
| 7 | **Then** Guests **or** more LA hosts | A2 Phase 3 vs product recruitment |

**You are between steps 1–5.** Steps 3–5 from the *old* advisor plan are largely **built**; this week is **validate + stabilize**, not rebuild.

---

## 2. Stack verdict (advisor ↔ repo)

| Layer | Advisor says | Rally today |
|-------|----------------|-------------|
| App | React Native | ✅ |
| Auth | Supabase Auth | ✅ |
| Data | Postgres + RLS + RPCs | ✅ migrations 001–032 |
| Realtime | Active chat only | ✅ scoped to open threads |
| Server | No API server yet | ✅ correct for beta |
| Edge Functions | When needed (push, jobs) | ✅ `send-push` exists |
| Redis / queue / search / warehouse | Later | ✅ not needed now |

---

## 3. Architecture groundwork (advisor “do now” vs repo)

| Recommendation | Status | Notes |
|----------------|--------|--------|
| Business rules in Postgres RPCs | **Done** | join, lock, kick, attendance, crew join, etc. |
| Strict RLS | **Done** | ongoing QA §8.13 |
| Clear migration naming | **Partial** | Local `001–032`; remote uses timestamp IDs — use `db query -f` for one-offs |
| Analytics event table | **Partial** | Product events + `analytics_crew_*` views (026); not full event warehouse |
| Feature flags / config table | **Done** | `app_feature_flags` (027) |
| Rate-limit table | **Done** | Stage 2 + feature-flagged limits |
| Server views/RPCs for Home & Inbox | **Partial** | Client aggregates Home; `get_inbox_message_previews` (031) |
| Realtime scoped to open chat | **Done** | design intent |
| Indexes for Home, inbox, messages, activities | **Open** | NEXT_ITEMS #14; add when slow |
| Edge Functions folder, no separate API | **Done** | `supabase/functions` |

**Open (groundwork, not product features):**

- Home/Inbox **single RPC** if client queries get slow (NEXT_ITEMS #10)
- **player_count** invariant constraint optional (NEXT_ITEMS #13)
- Migration ledger alignment remote ↔ local (ops)

---

## 4. One-week execution plan (merged)

| Day / focus | Task | Owner | Doc |
|-------------|------|-------|-----|
| **P0** | Preview build on 2 phones (iOS + Android) | You | `QA_BUILD_HANDOFF.md` |
| **P0** | Run full QA checklist Public + Rally | You | `QA_BETA_CREW_CHECKLIST.md` |
| **P0** | Fix only P0 bugs in **built** scope | Eng | no Guests/A7 as bugs |
| **P1** | Re-test Home host card + Rally profile load | You | fixes in PR #5/#6 |
| **P1** | One host marks attendance after a real game | You | confirms A5 path |
| **P1** | Query `analytics_crew_lifecycle` | Product | `stage-2-cost-metrics.md` |
| **P2** | EAS preview rebuild if icon/build stale | Eng | NEXT_ITEMS #17 |
| **P2** | Recruit 2–3 more LA hosts if replay low | Product | `open_items.md` |

**Do not this week:** Guests (A2), mini tournament polish, Teams/Leagues, new tabs, API server, Redis.

---

## 5. UI / route test checklist (condensed)

Use full script: [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md).

| Route | P0 checks |
|-------|-----------|
| Auth | Signup, login, profile loads |
| Home | Next Up, host lock (not green when alone), glossary |
| Discover | Join request unchanged for public game |
| Create | Public default; link to Rally |
| Game Room | Approve, I'm in, lock, kick pre-lock |
| Rally chat | Multi-session cards, join, waitlist |
| Rally profile | Loads (no PostgREST error) |
| Chats inbox | No duplicate Rally + game rows |
| Profile | Timezone, reliability line, Friends, My games |
| Post-game | Host attendance after game end |

---

## 6. Open items — single list

### P0 — Stabilize + validate (delegated QA)

| ID | Item | Type | Status |
|----|------|------|--------|
| QA-ALL | Collective QA on preview (two devices) | QA | **Delegated** — [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md) |
| QA-03 | Discover public join unchanged | QA |
| QA-06–07 | Join / I'm in / lock + multi-session Rally | QA |
| QA-08 | DB/RLS smoke (030–032) | QA |
| QA-11 | iOS + Android runtime sign-off | QA |
| RUN-01 | Fix P0 bugs from QA only | Eng |
| INFRA-01 | Reliable preview install (TestFlight / internal) | Infra |
| DATA-01 | Confirm 032 on preview Supabase | Done ✅ verify in QA |

### P1 — In progress (engineering started 2026-06-03)

| ID | Item | Type | Status |
|----|------|------|--------|
| WAIT-UX-01 | Full game → **Join waitlist**; **On waitlist** on cards, Home, Game Room, My games | Eng | **Done** (this pass) |
| FRIENDS-UX-01 | **Add friends** on Home + Profile (opens search); was Profile-only row | Eng | **Done** (this pass) |
| METRIC-01 | Query `analytics_crew_lifecycle.retained` | Product | Open |
| HOST-01 | Recruit 5–10 LA badminton/pickleball hosts | Product | Open |
| A4-4 | QA crew pin does not bleed across sessions | QA | With delegated QA |
| PUSH-01 | Push matrix on physical devices | QA | With delegated QA |
| QA-09–10 | Inbox previews, admin/safety | QA | With delegated QA |
| PERF-01 | Home/Inbox RPC if load slow | Eng | Open |
| EAS-01 | Preview rebuild for testers | Eng | Open |
| WAIT-UX-02 | Push when waitlisted player gets spot | Eng | **Later** (needs notification) |

### P2 — After replay metric (pick **one** slice per sprint)

**Do not parallel:** payments, Teams, Redis, API server, punishment bots — see [PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md](./PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md).

| ID | Item | Type |
|----|------|------|
| ROSTER-UX-02 | Undo **I'm in** + leave copy before lock | Eng | **Done** 2026-06-03 |
| ROSTER-UX-03 | Host **release spot** after lock | Eng | **v1.1** — [ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md) |
| A2-2–8 | **Guests** (invite, RLS, inbox, QA) | Product+Eng |
| DISC-01 | Discover filters + empty CTA polish | Eng |
| CREW-01 | Reliability on all Rally member rows | Eng |
| TOUR-01 | Mini tournament polish | Eng |
| A3-2 | Roster confirmation push | Eng |
| A6-3 | Merge legacy chat into crew thread | Eng (risky) |
| A6-4 | Drop `activity_rsvps` | Eng |

### Deferred — Business gate (Stages 4–7)

| ID | Item |
|----|------|
| A7 | Public game = ephemeral Rally |
| TEAMS-01 | Full Teams |
| LEAGUE-01 | Full Leagues |
| PAY-01 | Payments / fee split |
| MULTI-01 | Rally multi-sport |
| Monetization | Organizer Pro, Player Plus |

### Open — Nice / scale (not blocking beta)

| ID | Item | Ref |
|----|------|-----|
| ARCH-01 | Index `messages(conversation_id, created_at desc)` | NEXT_ITEMS #14 |
| ARCH-02 | Roster trigger monitoring under load | NEXT_ITEMS #12 |
| ARCH-03 | Court photos / routing | Roadmap |
| ARCH-04 | Push deep-link to session | NEXT_ITEMS #7 |
| ARCH-05 | Beta seed re-run | NEXT_ITEMS #15 |

---

## 7. What is already shipped (do not rebuild)

- Rallys naming, glossary, Dynamic Home, session notes, waitlist  
- Join → I'm in → lock, host kick, post-game attendance, reliability v1  
- Rally chat + session cards, legacy inbox hide, migration 032  
- Crew analytics views, feature flags, rate limits, entitlements scaffold  
- Mini tournament MVP skeleton  

Detail: [ADVISOR_IMPLEMENTATION_PLAN.md](./ADVISOR_IMPLEMENTATION_PLAN.md) master backlog B–G.

---

## 8. Decision tree after this week

```text
QA P0 clear?
  no  → fix bugs, re-QA (no new features)
  yes → query analytics_crew_lifecycle.retained
          low  → recruit LA hosts, instrument replay (skip Guests)
          ok   → Phase 3 Guests (A2) OR Discover polish (founder choice)
          never → mini tournaments polish only if groups ask for it
```

**Monetization (Teams, Leagues, payments):** still blocked until replay proves retention ([open_items.md](../../open_items.md)).

---

## 9. Doc map

| Read this | For |
|-----------|-----|
| **This file** | Merged advisor + repo + open items |
| [PROJECT_STATUS_FOR_ADVISOR.md](./PROJECT_STATUS_FOR_ADVISOR.md) | Short paste for next advisor chat |
| [WHAT_NEXT.md](./WHAT_NEXT.md) | Engineering next steps |
| [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md) | Device test script |
| [IMPLEMENT_PLAN.md](./IMPLEMENT_PLAN.md) | Locked semantics |
| [ADVISOR_IMPLEMENTATION_PLAN.md](./ADVISOR_IMPLEMENTATION_PLAN.md) | Ticket checkboxes |
| [open_items.md](../../open_items.md) | Business / monetization |
| [ROADMAP.md](../ROADMAP.md) | Engineering history |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-03 | Merged external advisor review (2026-06-03) with Track A build state and open-item index |
