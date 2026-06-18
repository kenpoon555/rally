# Module contract — Student profile (parent-owned)

**Contract id:** `module-student-profile`  
**Status:** Implemented — v1.2 (flag-gated; DB + Family UI)
**Track:** [coach-parent-student/implementation-plan.md](../coach-parent-student/implementation-plan.md)

## Purpose

**Parent-owned, reusable** student profiles — not owned by class, coach, or academy.

North-star: **Adult parent creates “Alex” once → enrolls in multiple classes without duplicate profiles.**

## Data model (proposed)

```text
profiles (existing adult user)
  └── student_profiles
        id, parent_user_id, display_name, birth_year_optional?, notes_private
        status: active | archived
  └── student_enrollments
        student_profile_id, class_id | rally_id | activity_series_id
        coach_user_id, org_id nullable
        enrolled_at, ended_at
```

**Rules:**

- Only `age_category = 18+` parent can create `student_profiles`.
- Max **3–5** active student profiles per parent (free tier abuse control).
- Student profile has **no** login credentials in v1.
- No `username`, `avatar_public`, or discover flags on student profile.

## Visibility

Enforced via [module-student-visibility.md](./module-student-visibility.md) + RLS.

## UI entrance — Profile Family section

Navigation: [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) · [parent-student-coach-ui-ideas.md](../coach-parent-student/parent-student-coach-ui-ideas.md)

| Surface | Route |
|---------|-------|
| **Family section** | Profile → **Family** → Family Profiles |
| List | Per-child card: nickname · class summary |
| Add | **Add Child Profile** on list → consent → create |
| Enroll | Coach invite deep link → **child profile picker** (primary join path) |
| Ongoing | Today **My Classes** / Rally hub class detail |

Mockup: [mockups/parent-students.png](../coach-parent-student/mockups/parent-students.png)

## Pass/fail checklist (when built)

- [x] **Family section** visible on Profile when flag on or profiles exist
- [x] Family Profiles list screen from section
- [x] 18+ parent can create student profile with display name
- [x] Under-18 account cannot create student profile
- [x] Parent sees list of their student profiles
- [x] Parent can archive/delete student profile
- [ ] Same student enrollable in 2+ classes without duplicate profile rows
- [x] Coach cannot create student profile on parent's behalf without invite flow
- [x] Free tier blocks 6th profile with clear message (not paywall for 1 child)
- [ ] Audit log: `student_profile_created`, `student_profile_deleted`

## Human decision gates (H*)

| ID | Question |
|----|----------|
| H1 | Store birth year or age band only on student profile? |
| H2 | Parent can export student data — format? |
| H3 | Claim-at-18 migration — which history transfers? |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — small table growth.

## Screenshots required

`docs/contracts/screenshots/module-student-profile/`

| File | State |
|------|-------|
| `01-family-profiles-list.png` | Family Profiles list (Alex, Mia) |

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| Family list | Pass | `01-family-profiles-list.png` — DB-backed rows |
| 18+ create gate | Pass | `canCreateStudentProfiles` + RLS `parent_is_adult_18_plus` |
| Teen blocked | Pass | Age gate + service guard |
| Archive | Pass | Long-press archive on list |
| 5-profile cap | Pass | `MAX_ACTIVE_STUDENT_PROFILES = 5` |
| Multi-class enroll | Pending | v1.3 enrollment contract |
| Analytics audit | Pending | `student_profile_*` events not wired yet |

## Out of scope

- Teen self-managed profile (13–17) — future contract
- Academy bulk CSV import without parent enrollment

## Related

- [flow-student-class-enrollment.md](./flow-student-class-enrollment.md)
- [flow-parent-guardian-consent.md](./flow-parent-guardian-consent.md)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-17 | Migration 067 applied | — |
