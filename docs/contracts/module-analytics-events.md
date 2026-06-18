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

## Beta scorecard events (GTM 2 blocker — [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md))

**Required before first real-group beta readout.** Add to `ProductEventName` before implementing.

| Event | When fired | Maps to scorecard | GTM 2 |
|-------|------------|-------------------|-------|
| `invite_link_opened` | Deep link / universal link received | Invite links opened | **Required** |
| `signup_completed` | First successful auth after install | Users installed / onboarded | **Required** |
| `crew_joined` | User becomes Rally member | Users joined Rally | **Required** |
| `game_ready_set` | Member taps I'm in (`ready_at` set) | Users tapped I'm in | **Required** |
| `roster_locked` | Host finalizes roster | Games locked | **Required** |
| `attendance_submitted` | Host submits attendance form | Attendance submitted | **Required** |
| `recap_viewed` | Recap screen opened | Recap seen | **Required** |
| `second_session_scheduled` | Schedule next / duplicate game | Second sessions scheduled | **Required** |

Existing events that partially cover scorecard: `crew_invite_redeemed`, `crew_replayed`, `recap_shared` (P1 share only).

## Coach / parent / student track (v1.3+ — no PII)

See [coach-parent-student/implementation-plan.md](../coach-parent-student/implementation-plan.md). Add when implementing — **never** include child name or DOB in payload.

| Event | When fired |
|-------|------------|
| `student_profile_created` | Parent creates profile |
| `student_enrolled` | Enrollment complete |
| `coach_minor_roster_viewed` | Coach opens class roster |
| `parent_consent_recorded` | Guardian attestation saved |

## Funnel events (add when implementing dormancy / host tools)

| Event | Status |
|-------|--------|
| `crew_dormancy_nudge_sent` | Host dormancy push sent — see `flow-crew-dormancy-nudge.md` |
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

### GTM 2 scorecard (blocker before beta readout)

- [ ] All eight **Required** beta scorecard events wired in app (see table above)
- [ ] `analytics_crew_funnel_30d` returns non-empty rows after one demo loop
- [ ] Validator can query linked Supabase views without PII leak

## Out of scope

- Third-party analytics SDKs (Amplitude, etc.)
- Marketing attribution

## Related

- [launch-roadmap-jun-2026.md](../launch-roadmap-jun-2026.md) — weekly scorecard
- [FOUNDER_WEEK2_CHECKLIST.md](../FOUNDER_WEEK2_CHECKLIST.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | Planned funnel events not in types yet | — |
