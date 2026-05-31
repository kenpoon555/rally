# Agent workstreams: sport-specific matching

Last updated: 2026-04-11

Use this to parallelize work without duplicating context. Pick **one workstream per session** when possible.

## 1. Product / docs

- Keep [`ROADMAP.md`](../ROADMAP.md) aligned with launch wedge and profiles.
- Maintain [`docs/sport-matching-profiles.md`](sport-matching-profiles.md), [`docs/phase2-fast-fixed-matching.md`](phase2-fast-fixed-matching.md), [`docs/chat-mvp-boundary.md`](chat-mvp-boundary.md).
- Extend [`docs/v2-v4-implementation-backlog.md`](v2-v4-implementation-backlog.md) with profile-based epics when scope changes.

## 2. Config / foundation

- Single source of truth: [`src/constants/sports.ts`](../src/constants/sports.ts) (`SPORT_METADATA`, `LAUNCH_SPORT_TYPES`).
- Catalog hook: [`src/hooks/useSportsCatalog.ts`](../src/hooks/useSportsCatalog.ts) (`sports` = launch only, `allSports` = full metadata).

## 3. Matching UX

- [`src/pages/Activity/CreateActivityScreen.tsx`](../src/pages/Activity/CreateActivityScreen.tsx) — sport chips, default scheduling from metadata.
- [`src/pages/Home/HomeScreen.tsx`](../src/pages/Home/HomeScreen.tsx) — Discover filters use launch sports.
- [`src/components/ActivityConfirmationModal.tsx`](../src/components/ActivityConfirmationModal.tsx) — geofence quick-create respects profile.

## 4. Matching logic / RPC

- [`src/services/activityService.ts`](../src/services/activityService.ts) — keep RPC contracts; extend only when a profile needs new constraints (thresholds, min overlap).
- Supabase SQL: [`supabase/migrations/003_flexible_matching.sql`](../supabase/migrations/003_flexible_matching.sql).

## 5. Chat hardening (after MVP lock)

- [`src/services/chatService.ts`](../src/services/chatService.ts) — unread, pagination, ordering (see [`docs/chat-mvp-boundary.md`](chat-mvp-boundary.md)).

## 6. QA

- Per-profile checklists: Phase 3/6 for flex flows; add Phase 2 checklist when `fastFixed` sports go live.
- Results: [`docs/phase-3-validation-results.md`](phase-3-validation-results.md), [`docs/phase-6-8-validation-results.md`](phase-6-8-validation-results.md).

## Handoff template

```
Workstream: <1–6>
Goal: <one sentence>
Files: <paths>
Acceptance: <testable criteria>
```
