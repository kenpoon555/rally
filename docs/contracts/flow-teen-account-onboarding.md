# Flow — Teen account onboarding (13–17)

**Contract id:** `flow-teen-account-onboarding`  
**Status:** **Green** — validation 2026-06-22 (B3/B4): teen + erroneous `is_coach=true` force-hides coach surfaces  
**Track:** v1.2 · [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)  
**Product review:** [2026-06-21-onboarding-synthesis.md](../product-review/consolidated/2026-06-21-onboarding-synthesis.md)  
**Related code:** `AgeGateScreen.tsx`, `SignupScreen.tsx`, `canCreateStudentProfiles`, `coachParentService`, `DynamicHomeScreen.tsx`, `TodayMyClassesCard.tsx`

## Purpose

Users who select **13–17** at signup get a **restricted teen account** — can join adult-organized pickup/Rally as allowed, but **cannot** act as coach, create child profiles, or access parent/coach Pro surfaces.

North-star: **Teen selects 13–17 → completes signup → no Family / Coach Tools / CLASSES I TEACH → cannot create student profiles.**

## Demo setup

1. Sign out; fresh signup with `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true`.
2. Age gate: select **13–17**.
3. Complete email/password signup.

### H2 probe (Validator — policy-critical)

1. Create or use teen account (`age_category = teen_13_17`).
2. In linked Supabase: `update public.profiles set is_coach = true where id = '<teen_uuid>';`
3. Force-quit app → relaunch.
4. Assert: **zero** Coach Tools section on Profile; **zero** CLASSES I TEACH on Today.

## Required states

| State | Must show |
|-------|-----------|
| **Age prompt** | Three options before account created |
| **13–17 selected** | Signup continues (not blocked like Under 13) |
| **Post-signup Profile** | No Family section; no Coach Tools |
| **Post-signup Today** | No MY CLASSES block; no Family deep link |
| **Add Child attempt** | Blocked — adults only copy |
| **Become coach** | Not available |
| **Erroneous `is_coach=true`** | Coach Tools and CLASSES I TEACH **still hidden** (R3 locked) |
| **Pickup / Rally** | Same as adult player where policy allows teens in groups |

## Pass/fail checklist

### Signup + profile

- [x] 13–17 path completes signup
- [x] Under 13 path still blocked — see [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)
- [ ] Teen cannot open Add Child Profile successfully — adult-only alert
- [x] Age category stored on profile as `teen_13_17` — DB assertion per age-gate contract
- [x] Teen Profile Settings: **no** Family section; **no** Coach Tools section

### H2 probe — erroneous coach flag (P0 — R3 locked)

- [x] Teen (`teen_13_17`) never sees Coach Tools regardless of `profiles.is_coach`
- [x] Teen (`teen_13_17`) never sees **CLASSES I TEACH** on Today regardless of `is_coach`
- [x] H2 probe: DB `is_coach = true` on teen account → force-quit → relaunch → **zero** Coach Tools + **zero** CLASSES I TEACH
- [ ] Teen cannot access Create Class / Class-Clinic create option — see [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)

### Today / navigation (P1)

- [x] Teen Today has **no** MY CLASSES card — no parent copy (*No upcoming classes for your children*)
- [x] Teen Today has **no** “Manage classes for your child →” Family deep link
- [ ] R0 player Today also has no MY CLASSES — cross-ref [flow-coach-onboarding-org.md](./flow-coach-onboarding-org.md)

### Policy

- [ ] Store age rating aligns with behavior (H* founder + lawyer)

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Age gate → signup form | < 1s transition |

## Estimated monthly cost

**Δ:** $0.

## Release decisions (2026-06-21 onboarding-round1)

| ID | Question | Decision |
|----|----------|----------|
| R3 | Teen erroneous `is_coach` handling | **A: Force-hide** all coach surfaces for `teen_13_17` (locked) |

## Human decision gates (H*)

| ID | Question | Default |
|----|----------|---------|
| H1 | Can teens join any public pickup or host-only? | Product — document in safety design |
| H2 | Ignore erroneous `is_coach` on teen accounts? | **Force hide** coach surfaces — matches **R3 locked** |
| H3 | Teen DM restrictions | See [parent-student-coach-safety-design.md](../coach-parent-student/parent-student-coach-safety-design.md) |

## Screenshots required

`docs/contracts/screenshots/flow-teen-account-onboarding/`

| File | State |
|------|-------|
| `01-age-gate-teen-selected.png` | 13–17 selected |
| `02-profile-no-family-coach.png` | Teen Profile — no CPS sections |
| `03-add-child-blocked.png` | Adult-only alert if navigated |
| `04-today-no-my-classes.png` | Teen Today — no MY CLASSES block |
| `05-h2-probe-no-coach-after-flag.png` | After DB `is_coach=true` — still no coach UI |

## Out of scope

- Parent-managed teen linked account (future)
- Claim-at-18 migration
- Payments
- Emancipated-minor coach edge case (R3 rejects — force-hide)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-21 | **P0:** `userIsCoach` / `shouldShowCoachToolsSection` ignore `age_category` — B3 | Engineering |
| 2026-06-21 | **P1:** Today MY CLASSES shown to teens when `PARENT_FAMILY_UI` on — B4 | Engineering |
| 2026-06-15 | Teen vs adult pickup policy not fully specified | Product |

## Related

- [flow-age-gate-onboarding.md](./flow-age-gate-onboarding.md)
- [module-student-profile.md](./module-student-profile.md)
- [module-coach-parent-navigation.md](./module-coach-parent-navigation.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
| Teen Profile — no Family/Coach | Pass | `@teenr5676` Settings: VALIDATOR → PAYMENTS only (`02-profile-no-family-coach.png`) |
| H2 — `is_coach=true` force-hide | Pass | DB `is_coach=true`, `teen_13_17` — still no coach UI (`05-h2-probe-no-coach-after-flag.png`) |
| Today — no MY CLASSES | Pass | No parent block or Family deep link (`04-today-no-my-classes.png`) |
| Age category DB | Pass | `teen_13_17` on `teen.r5.1782085676@rally-mvrhoops.demo` |
