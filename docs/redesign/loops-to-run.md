# Roadmap — what's left to run (living doc)

_Last updated: 2026-06-28 (session 2). Supersedes the 2026-06-26 "loops to run" list (those 3 loops are all shipped — see Done)._

Two parallel tracks now:
- **Product track** — UX tiers 0–6 (judge the screens). [TIER-MODEL.md](../product-review/TIER-MODEL.md)
- **Engineering track** — perf / architecture / scale (judge the system). [ENG-REVIEW-MODEL.md](../eng-review/ENG-REVIEW-MODEL.md)

> Why two tracks: tiers 0–6 all share one axis (a human looking at a screen) and saturate. Real continued improvement comes from *orthogonal* axes — engineering, and eventually real-usage telemetry — not from running a 9th opinion pass. See the 2026-06-28 strategy note in chat.

---

## ✅ Done (this arc)

| Loop / work | Track | Output | PR |
|-------------|-------|--------|----|
| `class-response-round1` | Product T1 | Next Class actions (Confirm / Can't make it / Message coach) | #92, #93 |
| `taste-tier6-join-loop` | Product T6 | Join-Loop authoring verdicts (J1–J7) | #89, #90 |
| `theme-explore-round1` | Product T6 (gen) | 6 theme candidates + logos; contrast gate | #91 |
| `tier0-join-loop` | Product T0 | Dogfood triage → spot-label single source + viewer-state gating + ready-count copy (H1/H2) | #95, #96 |
| **`query-cost-auditor` on discover feed** | Eng | 6 findings + EXPLAIN proof; 2 indexes (PR #97); ADR-0001 proposed | #97 |
| **`realtime-fanout-reviewer` on chat channels** | Eng | 4 findings; ADR-0002 proposed (channel-ownership model for reactions) | #98 |
| **5 mechanical fixes** (discover waterfall, channel rename, abort flag, fallback cap) | Eng | PR #99; 19/19 tests pass | #99 |
| **DB indexes applied to production** | Eng | `074_discover_perf_indexes.sql` pushed to production 2026-06-28 | — |
| **`scalability-skeptic` on 4 surfaces** | Eng | 5 findings; 1 → ADR-0001 (accepted), 4 → backlog | — |

---

## 🔜 In progress / decisions open

| Item | Track | State | Next step |
|------|-------|-------|-----------|
| **ADR-0001** (discover RPC) | Eng | **ACCEPTED** | Build: new SQL migration + `getNearbyActivities` thin wrapper |
| **ADR-0002** (chat channel ownership) | Eng | **ACCEPTED** | Build: `useChatChannel` hook; refactor `ChatThreadScreen` + `RallyChatPanel` |
| **ADR-0003** (typed navigation) | Eng | **proposed** | Founder decides: ~4–6h migration; eliminates 118 `as never` casts; low urgency, high value before reactions |

---

## 📋 Next — Engineering track

Run **one lens per session** ([eng-personas.md](../eng-review/eng-personas.md)); ≥3 lenses before consolidating to ADRs.

| # | Lens | Target | Why now |
|---|------|--------|---------|
| ~~E2~~ | ~~`scalability-skeptic`~~ | **DONE** — 5 findings; chat scroll-back (P1) + enrich cap (P1) + inbox cap (P2) + roster windowing (P2) queued | — |
| ~~E3~~ | ~~`state-management-auditor`~~ | **DONE** — 118 `as never` casts → ADR-0003 proposed; 0 effect dep issues | — |
| ~~E4~~ | ~~`error-resilience-auditor`~~ | **DONE** — Realtime backfill gap (P1); `withRetry` + host panel silent error (P2); core paths CORRECT | — |

**Mechanical fixes queued from query-cost-auditor (no ADR needed):**
- `idx_activities_status_start_time` partial index — **in PR #97**
- `idx_join_requests_activity_status` — **in PR #97**
- Fold/parallelize the discover waterfall queries (Findings 3, 4 from query-cost-auditor)
- Dedupe double join_requests fetch (Finding 3)

**Mechanical fixes queued from realtime-fanout-reviewer (no ADR needed):**
- Abort flag in `useJoinRequestNotifications` `setupHostListeners` (Finding 2)
- Rename `channel('activities')` → `channel('activities-discover')` in `useActivities` (Finding 3)
- Cap `getLastMessagePreviews` fallback with `.limit(conversationIds.length)` (Finding 4)

---

## 📋 Next — Product features & track

| # | Item | Approach | Notes |
|---|------|----------|-------|
| P1 | **Message reactions** | **Contract-first** (not a persona loop) | Lock 6 founder decisions (emoji set, gesture, where/who incl. **minor-safety on class announcements**, notifications, display) + data model via Eng track (`message_reactions` table, RLS, realtime reuse — ties to ADR-0002) |
| P2 | **CR-T0-3** | Builder backlog | Today header vs Next Up time mismatch (4:50 vs 5:00) — single time source |
| P3 | **CR-T0-4** | Seed fixture | 3-viewer fixture (host / member / non-member) for live state-matrix runs |
| P4 | **Theme palette decision** | Founder pick | Choose from 6 candidates in `theme-rounds/2026-06-26/`; then validator contrast gate before any palette ships |
| P5 | `cross-surface-tier4-round1` | Product T4 (8 personas) | Inbox/chat/reviews/attendance/trust/classes — **not yet run**; chains after a feature loop or docs-only |
| P6 | `visual-tier5-round1` | Product T5 (8 personas) | Design QA; requires T4 contract merge or runs parallel docs-only |

---

## 🧭 Not yet set up (future, founder-approved direction)

| Item | What it adds |
|------|--------------|
| **Telemetry / outcome loop** | The real improvement engine: pick 3–4 north-star metrics (activation, D7 return, crash-free), let real numbers drive fixes instead of personas. Uses existing `analyticsService.ts`. *(Deferred — not selected yet.)* |
| **Accessibility axis** | Dynamic type, screen reader, contrast — another orthogonal lens family |

---

## Suggested sequencing

1. **Founder reviews ADR-0001 and ADR-0002** — these gate the biggest upcoming work (discover RPC refactor, reactions).
2. **Land PR #97 indexes** (mechanical, low-risk, immediate win on discover).
3. **Land mechanical fixes from E1** (abort flag, channel rename, fallback cap) — independent, low-risk.
4. **P1 reactions contract** — once ADR-0002 is decided, lock the 6 founder decisions then build.
5. **E2 scalability-skeptic** on a large seed — validates ADR-0001 wall numbers.
6. Batch **P2/P3** (small Tier-0 backlog) anytime.
7. **P4 theme pick** whenever you want to feel directions; **P5/P6** when feature work settles.
