# Flow — Age gate at account creation

**Contract id:** `flow-age-gate-onboarding`  
**Status:** Implemented — v1.2 (flag-gated)  
**Track:** v1.2 prototype · [coach-parent-student/README.md](../coach-parent-student/README.md)  
**Screens:** Signup / welcome, age selection, blocked under-13 path  
**Related code:** `AgeGateScreen.tsx`, `Under13BlockedScreen.tsx`, `SignupScreen.tsx`, `AuthContext.tsx`

## Purpose

Collect **age category** at account creation so Rally can enforce parent-only under-13, restricted teens, and adult-only child-profile creation — without relying on a single “13+” checkbox.

North-star: **User selects age range → correct account path → no under-13 self-service account.**

## Demo setup

1. Fresh install or sign-out on sim.
2. Set `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true` and restart Metro.
3. Test three paths: Under 13, 13–17, 18+.

## Required states

| State | Selection | Must show |
|-------|-----------|-----------|
| **Age prompt** | First launch signup | Three options: Under 13 / 13–17 / 18+ |
| **Under 13** | Under 13 | Block self-signup; parent/guardian message; no account created |
| **13–17** | 13–17 | Teen signup continues (restricted — no child profiles, no payments) |
| **18+** | 18+ | Full adult signup continues |
| **Return user** | Already logged in | No age gate re-prompt unless policy requires periodic confirm |

## Pass/fail checklist

- [x] Age range shown before account is created (not after)
- [x] Under 13 cannot complete email/password signup
- [x] Under 13 copy: ask parent/guardian to create account
- [x] 13–17 cannot access “create student profile” (when that feature exists)
- [x] 18+ can proceed to normal auth
- [x] Age category stored on profile (category only — not DOB unless H* approved)
- [x] No redbox on any path
- [ ] Store listing age rating matches implemented behavior (H*)

## Human decision gates (H*)

| ID | Question | Default until lawyer |
|----|----------|----------------------|
| H1 | Collect exact DOB or category only? | **Category only** |
| H2 | Re-prompt existing users without age category? | TBD |
| H3 | App Store / Play declared audience age? | Founder + lawyer |

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Age screen → next step | < 1s tap response |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — one enum column on profiles.

## Out of scope

- Verifiable parental consent (see `flow-parent-guardian-consent`)
- Student profile creation
- ID verification / age assurance vendors

## Related

- [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md)
- [module-student-profile.md](./module-student-profile.md)

## Screenshots required

`docs/contracts/screenshots/flow-age-gate-onboarding/`

| File | State |
|------|-------|
| `01-age-gate-options.png` | Three age options |
| `02-under-13-blocked.png` | Parent/guardian blocker |
| `03-teen-signup.png` | Teen signup subtitle |

## Validator report template

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Three age options shown | Pass | `01-age-gate-options.png` |
| 2 | Under 13 blocked | Pass | `02-under-13-blocked.png` |
| 3 | 13–17 restricted path | Pass | `03-teen-signup.png` — subtitle shows 13–17 |
| 4 | 18+ full signup | Pass | Signup route accepts adult_18_plus |
| 5 | No redbox | Pass | Sim walkthrough clean |
