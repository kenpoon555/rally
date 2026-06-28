# Builder backlog — class-response-round1 · 2026-06-27

Tag `class-response`. **This queue requires src/** — implement then validate.

## P0 — src
| ID | Pri | File | Item |
|----|-----|------|------|
| CR1 | P0 | `studentEnrollmentService.ts` | `updateEnrollmentResponseStatus(enrollmentId, parentUserId, status)` → `student_enrollments.response_status` |
| CR2 | P0 | `TodayMyClassesCard.tsx` | Inline **Confirm** + **Can't make it** when `not_responded` + session not cancelled/deferred |
| CR3 | P0 | `TodayMyClassesCard.tsx` | Optimistic status flip + lightweight undo/change |
| CR4 | P0 | `TodayMyClassesCard.tsx` | **Message coach** affordance → class chat thread (not generic DM) |
| CR5 | P0 | `productCopy.ts` | `messageCoach`, `confirmAttendance` (reuse if present), response labels |
| CR6 | P1 | `ClassDetailScreen.tsx` | Optional: Message coach on overview if not on card — must still meet ≤2 taps from Today via card |

## Contract checklist rows (post-build)
| ID | Contract | Row |
|----|----------|-----|
| CC1 | `flow-class-session-response` | All pass/fail checklist rows |
| CC2 | `module-coach-parent-navigation` | Today → Message coach → class conversation |

## Branch
`fix/class-response-builder` from `dev`
