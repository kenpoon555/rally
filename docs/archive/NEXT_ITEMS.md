# Next items (architecture review + Track A reconciliation)

Last updated: 2026-06-02

**Superseded:** use **[PRODUCT_DIRECTION.md](./PRODUCT_DIRECTION.md)** + **[archive/SHIPPED_AND_DEFERRED_2026-06.md](./archive/SHIPPED_AND_DEFERRED_2026-06.md)**.

This file keeps the original architecture-review backlog with **status vs Track A build**.

## Product

| # | Item | Status |
|---|------|--------|
| 1 | Profile attendance % | **Done** — `get_user_attendance_stats` + Profile line |
| 2 | Merge legacy per-game chat history | **Deferred** — A6-3 (risky) |
| 3 | Session vs crew-level pins | **Done** — `session_note` + crew `pinned_announcement` |
| 4 | Regulars → Rallys naming | **Done** — user copy; DB unchanged |
| 5 | Real routing / court photos | Open — roadmap |
| 6 | Host schedule UX | **Done** — schedule from Rally chat / crew |
| 7 | Unread / push jump-to-session | Open — polish |

## Data / platform

| # | Item | Status |
|---|------|--------|
| 8 | Drop `activity_rsvps` | **Deferred** — A6-4 |
| 9 | Orphan `activity_group` cleanup | **Done** — migration 032 |
| 10 | Full inbox RPC extensions | Open — if perf issue |
| 11 | `profiles.timezone` UI | **Done** — Profile → Schedule |
| 12 | Roster trigger vs RPC | Open — monitor under load |
| 13 | Check constraint player_count | Open — optional |
| 14 | Index `messages(conversation_id, created_at)` | Open — scale |

## QA / release

| # | Item | Status |
|---|------|--------|
| 15 | Re-run beta seed on preview | Do if QA needs fresh data |
| 16 | Device QA crew loop | **= [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md)** |
| 17 | EAS preview rebuild | Do for TestFlight / icon fix |

## Review items intentionally deferred

- Full attendance analytics dashboard  
- Merging old chat histories (A6-3)  
- TestFlight marketing icon variants  
- **Phase 3 Guests (A2-2–A2-8)** — see [IMPLEMENT_PLAN.md](./IMPLEMENT_PLAN.md) §A2
