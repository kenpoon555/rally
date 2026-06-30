# WHAT-CHANGED

One-line-per-PR change log for Rally. Most recent at top.
Each entry: PR # · branch · what shipped · why it matters.

---

## 2026-06-28 (session 2)

### E4 `error-resilience-auditor` — 4 findings (docs only, no PR yet)
**File:** `docs/eng-review/error-resilience-auditor/2026-06-28-review.md`

| # | Finding | Priority |
|---|---------|----------|
| 1 | **Realtime reconnect: no backfill** — messages sent during network drop silently absent until re-nav | **P1 backlog** |
| 2 | **`withRetry` no backoff** — retries write ops immediately; risk of duplicate send on 500-after-success | P2 backlog |
| 3 | **Host join-request panel: silent error** — `loadJoinRequests` failure logs to console only, no UI feedback | P2 backlog |
| 4 | `respond()`, `applyReady`, bootstrap session — all **CORRECT** (optimistic + rollback + Alert + timeout guards) | ✅ |

---

### E3 `state-management-auditor` — 3 findings (docs only, no PR yet)
**File:** `docs/eng-review/state-management-auditor/2026-06-28-review.md`
**ADR drafted:** `docs/eng-review/adr/0003-typed-navigation.md`

| # | Finding | Priority |
|---|---------|----------|
| 1 | **118 `as never` nav casts** — fragmented per-file ParamList; only 6 of 22 routes typed globally | **→ ADR-0003** |
| 2 | **6× local `MainStackParamList` definitions** — each file carries a different partial copy, no sync | P1 (fixed by ADR-0003) |
| 3 | **187 effects, 0 exhaustive-deps suppressions** — all deps correct | ✅ no action |

---

### E2 `scalability-skeptic` — 5 findings (docs only, no PR yet)
**File:** `docs/eng-review/scalability-skeptic/2026-06-28-review.md`

| # | Finding | Wall | Priority |
|---|---------|------|----------|
| 1 | **No PostGIS geo-filter** — DB returns 120 rows by `start_time` globally; geo-filter is client-side → SF user gets 0 results when NYC has 500 games | ~500 active games in one city | **→ ADR-0001** (already accepted) |
| 2 | **Chat 100-msg hard cap, no scroll-back** — `getConversationMessages(id, 100)`, FlatList has no `onEndReached` | any thread > 100 msgs | **P1 backlog** |
| 3 | **Enrich: unbounded approved join_requests** — no `.limit()` on approved joiner fetch across 120 activities | 50 games × 100 joiners = 5k rows | **P1 backlog** |
| 4 | **Inbox: no limit** on `getMyConversations` | 300+ conversations | P2 backlog |
| 5 | **Roster: ScrollView not FlatList** — all participants mounted at once | 200-person rally | P2 backlog |

---

### DB indexes applied to production
Migration `074_discover_perf_indexes.sql` pushed via `supabase db push --linked`.

---

### PR #99 — `fix/eng-mechanical-fixes`
**5 mechanical fixes from E0 + E1 engineering lenses**

| File | Change | Why |
|------|--------|-----|
| `useActivities.ts` | Renamed `channel('activities')` → `channel('activities-discover')` | Prevented duplicate channel name collision when HomeScreen + MapScreen both mounted (E1 Finding 3) |
| `useJoinRequestNotifications.ts` | Added `cancelled` abort flag to `setupHostListeners` | Closed race window where async query resolves after cleanup, leaking one socket per hosted game per fast-unmount (E1 Finding 2) |
| `activityService.ts` | Parallelized 3 independent Supabase queries in `enrichActivitiesWithJoinRequests` | Eliminated sequential waterfall; 3 round-trips now fire in parallel (E0) |
| `activityService.ts` | Parallelized `queryDiscoverActivities` + `getUserActivities` + `getUserFriends` in `getNearbyActivities` | Same — saves 2 sequential round-trips on every discover load (E0) |
| `chatService.ts` | Added `.limit(Math.min(conversationIds.length * 5, 500))` to fallback query in `getLastMessagePreviews` | Capped unbounded row scan (was: all messages for N convos; now: max 500 rows) (E1 Finding 4) |

---

### PR #98 — `docs/e1-realtime-fanout`
**E1 engineering lens + ADR decisions**

- Created `docs/eng-review/realtime-fanout-reviewer/2026-06-28-review.md` — full E1 lens with 4 findings, teardown audit of 9 channel sites
- Created `docs/eng-review/adr/0002-chat-channel-ownership.md` — ADR proposing `useChatChannel` hook (**ACCEPTED**)
- Updated `docs/redesign/loops-to-run.md` — promoted to two-track living roadmap (Product + Engineering)

---

### PR #97 — `perf/discover-indexes`
**DB indexes — applied to production 2026-06-28**

| Migration | Index | Fixes |
|-----------|-------|-------|
| `074_discover_perf_indexes.sql` | `idx_activities_status_start_time` on `activities(status, start_time) WHERE status = 'active'` | Seq Scan on discover feed (E0 Finding 2) |
| `074_discover_perf_indexes.sql` | `idx_join_requests_activity_status` on `join_requests(activity_id, status)` | Unindexed status filter on join_requests (E0 Finding 6) |

---

## Open decisions (accepted, not yet built)

| ADR | Decision | What to build |
|-----|----------|--------------|
| ADR-0001 | ACCEPTED | Discover RPC — `discover_activities(p_viewer, p_lat, p_lng, p_radius_m, p_sport, p_limit, p_cursor)` replacing current multi-query discover path |
| ADR-0002 | ACCEPTED | `useChatChannel(conversationId)` hook owning channel lifecycle — prerequisite for message reactions |

---

## Engineering lens status

| Lens | Status | Output |
|------|--------|--------|
| E0 query-cost-auditor | Done | PR #97 (indexes) + PR #99 (parallelization) |
| E1 realtime-fanout-reviewer | Done | PR #98 (review doc + ADR-0002) + PR #99 (mechanical fixes) |
| E2 scalability-skeptic | **Done** | 5 findings: chat scroll-back (P1), enrich cap (P1), inbox cap (P2), roster windowing (P2) |
| E3 state-management-auditor | **Done** | 118 `as never` casts → ADR-0003 (typed nav); 6 local ParamList dupes; 0 exhaustive-deps violations (clean) |
| E4 error-resilience-auditor | **Done** | Realtime backfill gap (P1); `withRetry` no backoff (P2); host panel silent error (P2); respond/applyReady/bootstrap CORRECT |

---

## How to read this file

- **PR # links**: `gh pr view <N>` for full diff
- **ADR docs**: `docs/eng-review/adr/`
- **Lens reviews**: `docs/eng-review/<lens-name>/`
- **Loop roadmap**: `docs/redesign/loops-to-run.md`
