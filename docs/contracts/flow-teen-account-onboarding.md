# Flow — Teen account onboarding (13–17)

**Contract id:** `flow-teen-account-onboarding`  
**Status:** Stub — partial via age gate; dedicated teen restrictions TBD  
**Track:** v1.2 · [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)  
**Related code:** `AgeGateScreen.tsx`, `SignupScreen.tsx`, `canCreateStudentProfiles`, coach/parent flags

## Purpose

Users who select **13–17** at signup get a **restricted teen account** — can join adult-organized pickup/Rally as allowed, but **cannot** act as coach, create child profiles, or access parent/coach Pro surfaces.

North-star: **Teen selects 13–17 → completes signup → no Family / Coach Tools → cannot create student profiles.**

## Demo setup

1. Sign out; fresh signup with `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true`.
2. Age gate: select **13–17**.
3. Complete email/password signup.

## Required states

| State | Must show |
|-------|-----------|
| **Age prompt** | Three options before account created |
| **13–17 selected** | Signup continues (not blocked like Under 13) |
| **Post-signup Profile** | No Family section; no Coach Tools |
| **Add Child attempt** | Blocked — adults only copy |
| **Become coach** | Not available |
| **Pickup / Rally** | Same as adult player where policy allows teens in groups |

## Pass/fail checklist

- [ ] 13–17 path completes signup
- [ ] Under 13 path still blocked — see age-gate contract
- [ ] Teen cannot open Add Child Profile successfully
- [ ] Teen cannot see Coach Tools even if `is_coach` erroneously set (H2 — deny or hide)
- [ ] Age category stored on profile
- [ ] Store age rating aligns with behavior (H* founder + lawyer)

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Age gate → signup form | < 1s transition |

## Estimated monthly cost

**Δ:** $0.

## Human decision gates (H*)

| ID | Question | Default |
|----|----------|---------|
| H1 | Can teens join any public pickup or host-only? | Product — document in safety design |
| H2 | Ignore erroneous `is_coach` on teen accounts? | **Force hide** coach surfaces |
| H3 | Teen DM restrictions | See [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md) |

## Screenshots required

`docs/contracts/screenshots/flow-teen-account-onboarding/`

| File | State |
|------|-------|
| `01-age-gate-teen-selected.png` | 13–17 selected |
| `02-profile-no-family-coach.png` | Teen Profile — no CPS sections |
| `03-add-child-blocked.png` | Adult-only alert if navigated |

## Out of scope

- Parent-managed teen linked account (future)
- Claim-at-18 migration
- Payments

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-15 | Teen vs adult pickup policy not fully specified | Product |

## Related

- [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)
- [module-student-profile.md](./module-student-profile.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
