# Module contract — Student visibility & privacy

**Contract id:** `module-student-visibility`  
**Status:** Implemented — v1.2 RLS + client guards (flag-gated UI)  
**Referenced by:** all minor/student flows

## Purpose

Student profiles and minor participants must **never** appear in public Rally surfaces. Coaches/academies see students **only through enrollment**.

## Visibility matrix

| Surface | Adult player | Student profile |
|---------|--------------|-----------------|
| Discover / Play open games | Yes | **No** |
| Free Agent / Need Players | Yes | **No** |
| Public profile page | Yes (settings) | **No** |
| Public search | Yes | **No** |
| Public leaderboard | Yes (Rally) | **No** |
| Public recap share image | Yes | **No** — exclude minor names/photos |
| Rally chat (adult crew) | Yes | **No** student accounts in v1 |
| Coach class roster | N/A | **Yes** — enrolled only |
| Parent app | N/A | **Yes** — owner |

## Messaging rules

| From | To | v1 pilot |
|------|-----|----------|
| Coach | Parent/guardian | Allowed — class announcements |
| Coach | Student (under 13) | **No** direct DM |
| Adult | Student minor | **No** without parent visibility |
| Student teen 13–17 | Coach | TBD — H* gate |

## Pilot defaults (v1.3 — product decision)

| Gate | Decision | Rationale |
|------|----------|-----------|
| **H1** | **First name / nickname only** on coach roster | Minimize child data exposure |
| **H2** | **No photos** on coach roster in pilot | Defer until lawyer + abuse review |

Implement in [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md) and student profile `display_name` field.

## Pass/fail checklist

### Public surface exclusion
- [x] Student profile IDs excluded from Discover queries
- [x] Student names not in public API responses for non-enrolled viewers
- [x] Attempt to add student to public pickup game → blocked with explanation

### RLS + enrollment
- [x] RLS: coach SELECT on student only via enrollment join
- [ ] **RLS negative:** non-enrolled coach cannot SELECT student row (SQL test)
- [ ] **RLS negative:** anonymous/public query returns no student_profiles
- [ ] Substitute coach access expires with session assignment (v1.5+)

### Roster display (pilot)
- [ ] Coach roster shows **nickname / first name only** — no full legal name, DOB, address
- [ ] Coach roster shows **no photos** in v1.3 pilot
- [ ] Recap generation strips or blocks minor-identifying content

### Tests
- [ ] Unit/integration tests for RLS policies (not manual audit only)

## Abuse prevention

- Fake profile harm limited: **no public visibility**
- Report fake student profile → admin queue
- Audit: `coach_minor_roster_viewed`, enrollment access

## Screenshots / audit artifacts

`docs/contracts/screenshots/module-student-visibility/`

| File | State |
|------|-------|
| `rls-audit-policies.txt` | SQL audit — 6 policies on student tables |

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| RLS policies present | Pass | 6 policies — see `rls-audit-policies.txt` |
| Parent-only CRUD | Pass | `Parents manage own student profiles` + adult check |
| Coach enrolled-only SELECT | Pass | `Coaches view enrolled students` via `student_enrollments` |
| Discover exclusion | Pass | Separate `student_profiles` table; not in activities feed |
| Substitute coach expiry | Pending | v1.4 coach ops |
| RLS unit tests | Pending | Manual SQL audit only this pass |
| Recap minor strip | Pending | H* gate |

## Human decision gates (H*)

| ID | Question | Decision |
|----|----------|----------|
| H1 | Show first name only on coach roster vs full name? | **Nickname / first name only** (pilot) |
| H2 | Photos on coach roster — allowed in pilot? | **No** (pilot) |

## Out of scope

- End-to-end encrypted messaging
- Third-party moderation vendor

## Related

- [module-student-profile.md](./module-student-profile.md)
- [flow-coach-minor-class-roster.md](./flow-coach-minor-class-roster.md)
