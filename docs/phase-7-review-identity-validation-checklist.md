# Phase 7 Review + Identity Validation Checklist

Last updated: 2026-02-27

Use this checklist to validate anonymous-until-confirmed identity behavior and post-match review scoring.

## How to work on this

1. **Preconditions:** Apply migration `004_reviews_and_chat*` if needed; have 3 test accounts (A host, B participant, C non-participant). Optionally run the **Verification SQL** below in Supabase SQL Editor to confirm `player_reviews`, `profile_review_stats`, and `can_view_profile_identity` exist.
2. **Device testing:** On iOS and Android, run Cases 1–6 in order. For each case, note pass/fail and any defects.
3. **Record results:** Update `docs/phase-6-8-validation-results.md` under **Phase 7: Review + Identity** (Platform pass matrix, device validation checkboxes, and a short defect summary if any).
4. **Exit criteria:** Tick the Phase 7 exit criteria below when all cases pass on both platforms.

## Preconditions

- Migration `supabase/migrations/004_reviews_and_chat.sql` has been applied.
- Flexible or fixed activity flow can reach finalized/confirmed state.
- At least three test accounts are available:
  - Account A (host)
  - Account B (participant)
  - Account C (observer or non-participant)

## Platform Matrix

- [ ] iOS pass
- [ ] Android pass

## Case 1: Identity remains hidden before confirmation

Steps:

1. Account B discovers an activity that is not finalized.
2. Inspect participant list and player cards.

Expected:

- Non-confirmed users show anonymized labels/handles.
- Sensitive profile details and photo are not shown.

Failure signals:

- Full username/photo visible to non-confirmed participants.

## Case 2: Identity reveals after confirmation/finalization

Steps:

1. Confirm participant status by host approval/finalization.
2. Account A and B open activity details again.
3. Account C (non-participant) checks the same activity list.

Expected:

- Confirmed participants can see each other's identities.
- Non-participants still see anonymized identities.

Failure signals:

- Non-participants can see revealed identities.

## Case 3: Friends always see friend identity

Steps:

1. Ensure Account A and B are accepted friends.
2. Check profile identity in activity/friends surfaces.

Expected:

- Accepted friends can see friend profile details regardless of activity state.

Failure signals:

- Friend identity remains hidden even with accepted friendship.

## Case 4: Review submission constraints

Steps:

1. Mark one shared activity as `completed`.
2. Account A submits review for Account B.
3. Attempt duplicate submission for same activity pair.

Expected:

- First review succeeds.
- Duplicate review for same activity/reviewer/reviewed fails.

Failure signals:

- Duplicate review rows are inserted.

## Case 5: Review visibility threshold (5+)

Steps:

1. For a target account, create 1-4 valid review rows.
2. Query/read displayed profile score.
3. Add 5th valid review and re-check.

Expected:

- Aggregate score hidden before 5 reviews.
- Aggregate score visible at 5+ reviews.

Failure signals:

- Score visible with fewer than 5 reviews.
- Score remains hidden after 5 valid reviews.

## Case 6: Review access controls

Steps:

1. Non-participant account attempts to review users from unrelated activity.
2. Attempt editing/deleting another user's review.

Expected:

- Invalid insert/update/delete attempts are blocked by RLS.
- Reviewer can update only own review row.

Failure signals:

- Unauthorized review write succeeds.

## Verification SQL

```sql
-- Raw review rows
select id, activity_id, reviewer_id, reviewed_id, friendliness_rating, physicality_rating, overall_vibe_rating, created_at
from player_reviews
order by created_at desc
limit 30;
```

```sql
-- Aggregate profile score visibility
select user_id, review_count, raw_score, visible_score
from profile_review_stats
order by review_count desc
limit 30;
```

```sql
-- Identity helper check sample
select can_view_profile_identity('<target_user_uuid>', '<activity_uuid>');
```

## Phase 7 Exit Criteria

- [ ] Anonymous-until-confirmed behavior validated.
- [ ] Friend identity visibility exception validated.
- [ ] One-review-per-activity-pair constraint validated.
- [ ] 5-review score threshold validated.
- [ ] Review RLS protections validated.

## Results Logging

- Summarize pass/fail and defects in `docs/phase-6-8-validation-results.md` under Phase 7 section.
