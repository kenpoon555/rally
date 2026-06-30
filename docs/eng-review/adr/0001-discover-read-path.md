# ADR-0001: Consolidate the discover read path into a single server-side RPC

- **Status:** accepted
- **Date:** 2026-06-28
- **Lens / source:** `query-cost-auditor` ([review](../query-cost-auditor/2026-06-28-review.md))
- **Severity:** P1
- **Deciders:** Ken (founder)

## Context

One Play discover refresh fires **~11–12 sequential round trips** through `activityService.getNearbyActivities()` (auth → rate limit → activities → `getUserActivities` ×~4 → friends → `enrichActivitiesWithJoinRequests` ×3). User-perceived latency ≈ the **sum** of those trips.

Measured on the linked Rally DB (current scale: 42 activities, 74 join_requests):
- Discover query is a **Seq Scan on `activities` + in-memory Sort** (`EXPLAIN ANALYZE`: `Rows Removed by Filter: 32`, no index serves `status='active' ORDER BY start_time`). Fast now (1.9ms) because the table is tiny.
- Distance filtering happens **client-side** in JS (`activityWithinRadius`) after pulling up to `DISCOVER_QUERY_LIMIT=120` rows — so the radius isn't a real query bound.
- Viewer `join_requests` are fetched **twice** (in `getUserActivities` and again in `enrichActivitiesWithJoinRequests`).

**The wall:** at ~5k+ active activities (one mid-size city), every refresh becomes a full table scan + sort + a 120-row client-side geo filter + an 11-trip waterfall. This degrades silently — no current test or metric catches it because the demo seed is 42 rows.

## Decision

Introduce a **single server-side RPC** `discover_activities(p_viewer, p_lat, p_lng, p_radius_m, p_sport, p_limit, p_cursor)` that returns the discover page in **one round trip**, doing on the server:
1. `status='active'` filter using a real index (`(status, start_time)`),
2. **geo filter + sort by distance/time** (PostGIS / earth-distance) — not client-side,
3. **keyset pagination** (cursor on `start_time,id`), not a fixed 120-row pull,
4. the viewer's roster/join-state fields needed by the card (`missing_players`, `player_count`, viewer's own `join_requests` status) so the client does **not** issue follow-up `join_requests` queries per refresh.

Client `getNearbyActivities` becomes a thin wrapper over the RPC. `getUserActivities` / friend reads that are still needed run in **parallel** (`Promise.all`), not in series.

## Consequences

- **Positive:** discover refresh target **≤3 round trips** (ideally 1 RPC + auth), p95 < 300ms at 5k activities; real server-side radius + pagination; counts come from one source (extends the Tier-0 single-source-of-truth rule into the data layer).
- **Negative / cost:** new SQL function + RLS-safe `security definer` review (must not leak rows the viewer can't see — P0 given minors); migration; client refactor; tests.
- **Follow-ups (mechanical, can land first, independently):**
  - `idx_activities_status_start_time` partial index
  - `idx_join_requests_activity_status`
  - fold `enrich` 3rd query into its `Promise.all`; dedupe double join_requests fetch

## Alternatives considered

| Option | Why not |
|--------|---------|
| Just add indexes, keep the waterfall | Fixes Finding 2/6 but not the 11-trip latency or client-side geo (Findings 1/5) |
| Client-side `Promise.all` only (no RPC) | Cuts latency but still over-fetches + geo-filters in JS; doesn't scale the row count |
| Full search service (Elastic/Typesense) | Over-engineered for current stage; revisit only if Postgres geo hits a wall |

## Verification

Re-run `query-cost-auditor` against a **5k-activity seed**:
- Discover refresh ≤3 round trips; p95 < 300ms.
- `EXPLAIN ANALYZE` shows **Index Scan** (no Seq Scan, no full Sort) on the discover path.
- RLS test: a viewer cannot receive an activity/join_request row they aren't entitled to via the RPC.
