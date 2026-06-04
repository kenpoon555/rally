# Phase 6 Flexible Matching Validation Checklist

Last updated: 2026-02-23

Use this checklist to validate the flexible activity finalization model where the host sets constraints and the system finalizes the best slot.

## Preconditions

- Latest app build includes flexible matching fields in create/detail flow.
- Migration `supabase/migrations/003_flexible_matching.sql` has been applied.
- Two to four test accounts are available:
  - Account A (host)
  - Account B/C/D (participants)
- At least three `activity_locations` exist for a selected sport.

## Platform Matrix

- [ ] iOS pass
- [ ] Android pass

Run all core cases on both platforms.

## Case 1: Host creates flexible activity constraints

| Status | Notes |

Steps:

1. Account A opens create activity.
2. Choose flexible mode.
3. Set time window (for example 18:00-21:00), duration, and 1-3 candidate locations.
4. Publish activity.

Expected:

- Activity stores as `scheduling_mode = flex`.
- `match_status` starts as `open` or `collecting`.
- Candidate locations persist and are visible in detail.

Failure signals:

- Create succeeds but candidate options are missing.
- Activity is stored as fixed mode despite flexible selection.

## Case 2: Participants submit preference windows

| Status | Notes |

Steps:

1. Account B/C join flexible activity.
2. Each submits earliest/latest start preferences and preferred location.
3. Refresh activity detail for host and participants.

Expected:

- One preference row per user per activity.
- Updates overwrite the same preference row (no duplicates).
- Host sees submission count progress.

Failure signals:

- Duplicate preference records.
- Preference submission blocked for approved joiners.

## Case 3: Host finalizes best slot

| Status | Notes |

Steps:

1. Account A taps finalization action.
2. System runs `finalize_activity_best_slot`.
3. Re-open activity detail from all participant accounts.

Expected:

- Activity transitions to `match_status = finalized`.
- Final start time and location are set.
- `finalized_at` and `finalized_by` are populated.

Failure signals:

- Finalization does not change activity state.
- Non-host can finalize.

## Case 4: Deterministic finalization behavior

| Status | Notes |

Steps:

1. Keep the same preference set.
2. Trigger finalization flow again (or call RPC in SQL editor with same inputs).

Expected:

- Finalized output remains stable for unchanged inputs.
- No duplicate side effects from repeated finalize attempts.

Failure signals:

- Final result changes across repeated runs without input changes.

## Case 5: Access control on preferences

| Status | Notes |

Steps:

1. Use non-participant account to read/write preferences.
2. Use participant account to update another user preference row.

Expected:

- Non-participant cannot insert preference row.
- Users can only edit their own preference row.
- Host can read preference rows for hosted activity.

Failure signals:

- Unauthorized preference writes succeed.

## Verification SQL

```sql
-- Flexible activity records
select id, user_id, scheduling_mode, match_status, window_start, window_end, finalized_at, finalized_by
from activities
order by created_at desc
limit 20;
```

```sql
-- Candidate locations
select id, activity_id, location_id, priority_order, created_at
from activity_candidate_locations
order by created_at desc
limit 20;
```

```sql
-- Participant preferences
select id, activity_id, user_id, earliest_start, latest_start, preferred_location_id, updated_at
from activity_participant_preferences
order by updated_at desc
limit 30;
```

## Phase 6 Exit Criteria

- [ ] Flexible create flow validated end-to-end.
- [ ] Participant preference submission validated.
- [ ] Host-only finalization validated.
- [ ] Finalization output is deterministic for identical input set.
- [ ] RLS protections verified for preference data.

## Results Logging

- Summarize pass/fail and defects in `docs/phase-6-8-validation-results.md` under Phase 6 section.
