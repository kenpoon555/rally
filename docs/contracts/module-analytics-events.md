# Module contract — Product analytics events

**Contract id:** `module-analytics-events`  
**Status:** Draft — enforce on retention PRs  
**Scope:** `trackProductEvent`, `product_events` table, SQL views `analytics_crew_*`  
**Related code:** `src/services/analyticsService.ts`, `src/types/metrics.ts`, migration `026_crew_retention_funnel.sql`

## Purpose

Single source of truth for event names and retention funnel — agents must not invent ad-hoc event strings.

North-star: **Crew lifecycle queryable in Supabase — created → invite → replay.**

## Required event names (do not rename without migration)

| Event | When fired | Required properties |
|-------|------------|---------------------|
| `regular_group_created` | Rally created | `group_id` |
| `crew_invite_redeemed` | Invite accepted | `group_id`, `via` |
| `crew_replayed` | Schedule next / repeat game | `group_id`, `activity_id` |
| `poll_created` | Availability poll created | `poll_id`, `group_id`, `option_count` |
| `poll_voted` | Member votes | `poll_id`, `option_id` |
| `rotation_generated` | Host generates rotation | `activity_id`, `rotation_id` |
| `recap_shared` | User shares recap | `recap_id`, `activity_id` |

## Funnel events (add when implementing dormancy / host tools)

| Event | Status |
|-------|--------|
| `crew_dormancy_nudge_sent` | **Planned** — see `flow-crew-dormancy-nudge.md` |
| `first_game_locked` | **Planned** — add before scaling marketing |
| `first_invite_sent` | **Planned** — optional |

## SQL views (retention)

Validator may run read-only checks on linked Supabase:

```sql
SELECT * FROM analytics_crew_lifecycle LIMIT 20;
SELECT * FROM analytics_crew_funnel_30d;
```

## Pass/fail checklist

- [ ] New features use `ProductEventName` union in `src/types/metrics.ts` — no raw strings
- [ ] `trackProductEvent` called after successful RPC (not before)
- [ ] Events include `group_id` or `activity_id` when applicable for joins
- [ ] No PII in event payload (no email, no precise location)
- [ ] Unit test or typecheck passes for new event names

## Out of scope

- Third-party analytics SDKs (Amplitude, etc.)
- Marketing attribution

## Related

- [open_items.md](../../../open_items.md) — north-star metric
- [FOUNDER_WEEK2_CHECKLIST.md](../FOUNDER_WEEK2_CHECKLIST.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Planned funnel events not in types yet | — |
