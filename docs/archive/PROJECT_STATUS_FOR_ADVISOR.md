# Rally — project status (minimal context for advisor)

**Last updated:** 2026-06-03 (P1 started; QA delegated)  
**Merged review:** [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md) (full open items + advisor sequence)  
**App:** React Native + Supabase (LA badminton/pickleball closed beta)  
**DB:** Supabase project `casljueycxsqexpkdiuq` · migrations through **032**

Copy this doc (or link it) when asking for product/UX advice so the advisor does not need full repo context.

---

## What Rally is (one paragraph)

Rally helps people in LA find and coordinate **badminton/pickleball** games. Two game types:

1. **Public game** — listed on Discover; strangers join via request → host approves.  
2. **Rally game** — a scheduled session for a persistent **Rally** (group); members use **one Rally chat** with session cards; flow is **Join game → I'm in → Lock roster**.

Monetization (Teams, Leagues, payments) is **deferred** until **crew replay** retention is proven.

---

## Locked product decisions (do not re-litigate without founder)

| Topic | Decision |
|-------|----------|
| Naming | **Rallys** / **Start a Rally** (not Crew/Regulars in UI) |
| Commitment | Join = tentative; **I'm in** = commit; **Lock roster** = final; no auto-penalty for join-only |
| Reliability v1 | `confirmed_attended / committed_sessions` after lock + post-game host attendance |
| Guests | Rules signed off; **not built yet** (Phase 3) |
| Unified public-as-Rally (A7) | **Deferred** |
| Tabs | Home · Discover · Chats · Profile; **Friends** + **My games** under Profile → Social |

Detail: [IMPLEMENT_PLAN.md](./IMPLEMENT_PLAN.md)

---

## What is built (engineering complete — QA in progress)

| Area | Shipped |
|------|---------|
| **Auth & profile** | Signup/login, timezone setting, reliability line on profile |
| **Discover** | Nearby public games, join request, sport filter |
| **Create** | Public game default; link to open Rally for group scheduling |
| **Dynamic Home** | Next Up, active game rooms, needs I'm in, games near you, LA beta banner, host lock CTA |
| **Game Room** | Chat + roster + approve requests + I'm in + lock; host kick pre-lock |
| **Rally chat** | One `crew_group` thread per Rally; session cards; join / waitlist / I'm in |
| **Session note** | Per-game announcement (`session_note`) host-editable |
| **Post-game** | Host marks who attended → reliability stats |
| **Waitlist** | Full Rally session → waitlisted join result |
| **Legacy inbox** | Hide duplicate per-activity chats for Rally-linked games |
| **Copy** | `productCopy.ts` + glossary sheet |
| **DB** | Migrations 030–032 applied (crew chat, inbox, advisor RPCs) |

**QA script:** [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md)

---

## Known bugs fixed this session (reload app to verify)

| Issue | Cause | Fix |
|-------|--------|-----|
| Rally profile screen error (“more than one relationship… activities and profiles”) | Ambiguous PostgREST embed `user:profiles(...)` | Explicit FK hints in `regularGroupService` + `chatService` |
| Home shows **Ready to lock** with only host in room | Finalize rules allow host-only; UI mirrored that | UI: `needs_players` when zero approved joiners |

---

## Explicitly not built yet

- **Guests** on Rally games (invite by username, scoped chat, inbox split) — A2 Phase 3  
- **Roster confirmation push** (host nudge) — A3-2  
- **Merge old activity_group messages** into Rally chat — A6-3  
- **Drop `activity_rsvps` table** — A6-4  
- **Every public game = ephemeral Rally** — A7  
- **Full Teams / Leagues / payments** — Stages 4–7 gated on retention  
- **Discover filter polish**, **reliability on every Rally member row** — post-QA

---

## Current user-reported issues (verify after fix)

1. ~~Rallys screen load failure~~ — FK hints (above)  
2. ~~False “ready to lock” with empty roster~~ — host-only guard (above)  
3. ~~Collective QA~~ — delegated; engineering signed off for P1  

---

## What to do next

**QA:** Delegated to another tester — [QA_BETA_CREW_CHECKLIST.md](./QA_BETA_CREW_CHECKLIST.md). Engineering moves to **P1**.

**P1 shipped this pass:**
- **Waitlist UX** — full games show Join waitlist; waitlisted users see Home **Waitlist** section + My games badge + Game Room state  
- **Add friends** — Home Quick actions + Profile primary button → Friends search tab  

**P1 still open:** replay query, host recruitment, perf RPC, EAS rebuild, waitlist push when spot opens.

**Roster UX (2026-06-03):** Undo **I'm in** + **Leave** before lock; after lock → chat + post-game attendance ([ROSTER_COMMITMENT_POLICY.md](./ROSTER_COMMITMENT_POLICY.md)).

**Pre–v1.0 strategy:** [PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md](./PRE_V1_BUSINESS_AND_BUILD_PRIORITIES.md) — scaffold ops, defer payments/Teams/Redis until replay gate.

**Week 2 (founder):** [FOUNDER_WEEK2_CHECKLIST.md](./FOUNDER_WEEK2_CHECKLIST.md) — hosts, replay SQL, designer lock, read feedback in Admin.

**Shipped 2026-06-03:** Game room Exit; host pass (ready → join order); beta feedback module — [BETA_FEEDBACK_MODULE.md](./BETA_FEEDBACK_MODULE.md). Apply migration **033**.

**After P1 / QA:** Query replay % → **one** P2 slice (Guests or Discover polish), not parallel platform build.

**Open items (full list):** [ADVISOR_REVIEW_MERGED_2026-06-03.md](./ADVISOR_REVIEW_MERGED_2026-06-03.md) §6  

Also: [WHAT_NEXT.md](./WHAT_NEXT.md) · [ADVISOR_IMPLEMENTATION_PLAN.md](./ADVISOR_IMPLEMENTATION_PLAN.md) · [open_items.md](../../open_items.md)

---

## Key flows to reference in advice

```text
Public:  Discover → Join request → Approve → Game Room → I'm in → Lock → Play → Attendance
Rally:   Rally chat → Join session → I'm in → Lock → Play → Attendance
         (Schedule next game stays in same Rally chat)
```

---

## Wireframes / deep spec

[ADVISOR_AGENT_UPDATE_2026-06-02.md](./ADVISOR_AGENT_UPDATE_2026-06-02.md) — §6 screens, §8 QA

---

## Questions you might ask an advisor (examples)

- Is **Friends + My games on Profile** right for beta, or surface **My games** on Home for hosts?  
- When should Home show **Ready to lock** vs **Waiting on I'm in** vs hide the card?  
- Priority: **Guests (A2)** vs **Discover polish** vs **mini tournament polish** after QA?  
- Is **reliability v1** copy clear enough on profile for new players?
