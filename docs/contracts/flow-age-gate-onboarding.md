# Flow — Age gate at account creation

**Contract id:** `flow-age-gate-onboarding`  
**Status:** **Partial** — UI paths green; post-signup `age_category` DB persistence regression (P0 — B1)  
**Track:** v1.2 prototype · [coach-parent-student/README.md](../coach-parent-student/README.md)  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Screens:** Signup / welcome, age selection, blocked under-13 path  
**Related code:** `AgeGateScreen.tsx`, `Under13BlockedScreen.tsx`, `SignupScreen.tsx`, `AuthContext.tsx`, `userService.ts`

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

### UI paths

- [x] Age range shown before account is created (not after)
- [x] Under 13 cannot complete email/password signup
- [x] Under 13 copy: ask parent/guardian to create account
- [x] 13–17 cannot access “create student profile” (when that feature exists)
- [x] 18+ can proceed to normal auth
- [x] No redbox on any path
- [ ] Store listing age rating matches implemented behavior (H*)

### Post-signup DB assertion (P0 — all paths)

- [ ] After **18+** age-gate selection + signup completes, DB `profiles.age_category = 'adult_18_plus'` — verify without manual SQL
- [ ] After **13–17** age-gate selection + signup completes, DB `profiles.age_category = 'teen_13_17'`
- [ ] **Email-confirm deferral:** user confirms email on later session → `age_category` still matches original age-gate selection (not null)
- [ ] **Profile retry path:** first sign-in after deferred session creates/updates profile with correct `age_category`
- [ ] Null `age_category` after 18+ signup → **fail** — blocks Add Child with “Adults only” per [flow-parent-family-onboarding.md](./flow-parent-family-onboarding.md)

**How to verify:** After signup (or first post-confirm sign-in):

```sql
select id, email, age_category from public.profiles where email = '<fresh_account_email>';
```

Expected: `age_category` matches age-gate selection — never null for completed signup paths.

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

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | Fresh signup leaves `profiles.age_category` null — B1 | Engineering |

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
