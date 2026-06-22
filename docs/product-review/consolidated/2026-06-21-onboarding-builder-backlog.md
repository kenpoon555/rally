# Builder backlog — 2026-06-21 · onboarding

**Source:** [2026-06-21-onboarding-synthesis.md](./2026-06-21-onboarding-synthesis.md)  
**Queue:** `onboarding-round1` tier 1  
**Layer:** 2 (Builder agent) — **no contract PR until human approves synthesis**

Human approves this backlog → implement P0/P1 in `src/` → merge to `dev` → run validation handoff.

---

## P0 — Ship blockers

### B1 · Persist `profiles.age_category` on signup

| Field | Value |
|-------|-------|
| **Contract** | `flow-parent-family-onboarding`, `flow-age-gate-onboarding` |
| **Personas** | `parent-first-child`, `parent-via-class-invite` (2/6) |
| **Symptom** | Fresh 18+ signup leaves `profiles.age_category` null → `canCreateStudentProfiles` fails → “Adults only” before consent |
| **Likely files** | `src/context/AuthContext.tsx` (signup passes `ageCategory` but may skip on no-session path), `src/services/userService.ts` (`createUserProfile`), profile load on first sign-in |
| **Suggested checklist row** | After 18+ age-gate signup, DB `profiles.age_category = 'adult_18_plus'` without manual SQL |
| **Acceptance** | Fresh parent signup → Add Child reaches consent screen (or legal blocker), not “Adults only” |

### B2 · Show Profile Family when parent flags on + zero children

| Field | Value |
|-------|-------|
| **Contract** | `flow-parent-family-onboarding` (H1 default) |
| **Personas** | `parent-first-child`, `parent-via-class-invite`; cross-ref `coach-parent-dual` |
| **Symptom** | `shouldShowFamilySection(userId, studentCount)` returns false unless `studentCount > 0` or Marcus ID |
| **Likely files** | `src/services/coachParentService.ts` (`shouldShowFamilySection`), `src/hooks/useCoachParent.ts`, `ProfileFamilySection.tsx` |
| **Suggested checklist row** | Flag-on 18+ parent with zero children sees FAMILY on Profile Settings with empty copy + Add Child path |
| **Acceptance** | Primary path Profile → Family → Add Child reachable without Today detour |

### B3 · Force-hide coach surfaces for teens (H2)

| Field | Value |
|-------|-------|
| **Contract** | `flow-teen-account-onboarding` (H2) |
| **Personas** | `teen-restricted-account` (1/6, policy-critical) |
| **Symptom** | `userIsCoach` / `shouldShowCoachToolsSection` ignore `age_category` — teen + `is_coach=true` shows Coach Tools + CLASSES I TEACH |
| **Likely files** | `src/services/coachParentService.ts`, `src/pages/Home/DynamicHomeScreen.tsx` (Today coach card), Profile Settings coach section |
| **Suggested checklist row** | Teen (`teen_13_17`) never sees Coach Tools or CLASSES I TEACH regardless of `is_coach` |
| **Acceptance** | H2 probe: DB `is_coach=true` on teen → still no coach UI after relaunch |

---

## P1 — High-frequency / enrollment gaps

### B4 · Gate Today MY CLASSES card

| Field | Value |
|-------|-------|
| **Contract** | `flow-coach-onboarding-org`, `flow-teen-account-onboarding`, `module-coach-parent-navigation` |
| **Personas** | 4/6 (`player-no-coach-tools`, `coach-approved-manual`, `parent-first-child`, `teen-restricted-account`) |
| **Symptom** | `{PARENT_FAMILY_UI ? <TodayMyClassesCard /> : null}` renders for all flag-on users — parent copy + Family deep link |
| **Likely files** | `src/pages/Home/DynamicHomeScreen.tsx`, `src/components/coachParent/TodayMyClassesCard.tsx`, `useCoachParent.ts` |
| **Suggested rule** | Show when adult + (`studentCount > 0` OR explicit parent intent OR active enrollments); hide for R0, teens, coaches with zero children |
| **Acceptance** | R0 player and teen Today have no MY CLASSES block; parent with children or post-enroll sees appropriate copy |

### B5 · Resume class invite after inline Add Child (`returnToInvite`)

| Field | Value |
|-------|-------|
| **Contract** | `flow-student-class-enrollment` |
| **Personas** | `parent-via-class-invite` |
| **Symptom** | Invite/picker passes `returnToInvite` param; `AddChildProfileScreen` ignores it |
| **Likely files** | `src/pages/CoachParent/AddChildProfileScreen.tsx`, `ParentClassInviteScreen.tsx`, `ChildProfilePickerScreen.tsx` |
| **Acceptance** | Inline add from enroll link → after create (post-consent) → returns to picker/confirm with invite context |

### B6 · Remove Marcus ID hardcode from role visibility

| Field | Value |
|-------|-------|
| **Contract** | `flow-become-a-coach`, `module-coach-parent-navigation` |
| **Personas** | `coach-parent-dual` (reference); enables B2/B3 testing on fresh accounts |
| **Symptom** | `userIsCoach` and `shouldShowFamilySection` special-case `MARCUS_ID` |
| **Likely files** | `src/services/coachParentService.ts` |
| **Acceptance** | Marcus demo still works via DB flags + seed data, not hardcoded user id in visibility helpers |

---

## P2 — Process / polish (optional this sprint)

### B7 · Document coach approval relaunch in TestFlight notes

| Field | Value |
|-------|-------|
| **Contract** | `flow-become-a-coach` |
| **Personas** | `coach-approved-manual` |
| **Note** | v1 acceptable — no code required unless adding profile refresh subscription |

### B8 · Gate VALIDATOR dev rows behind `__DEV__`

| Field | Value |
|-------|-------|
| **Contract** | — (dev hygiene) |
| **Personas** | 5/6 reviews cite noise |
| **Likely files** | Profile Settings screen hosting validator test rows |

### B9 · Coach name on class invite preview

| Field | Value |
|-------|-------|
| **Contract** | `flow-student-class-enrollment` |
| **Personas** | `parent-via-class-invite` (P3) |

---

## Explicitly not builder (v1 documented stops)

| Item | Owner | Notes |
|------|-------|-------|
| Guardian consent lawyer gate | Legal | `GUARDIAN_LAWYER_COPY_APPROVED=false` — explicit “Legal review in progress” copy is correct |
| In-app Become a coach apply | Product v2 | Founder SQL approval matches v1 stub |
| Create Game title in class mode | Product P3 | Workable with Class/Clinic banner |

---

## Suggested implementation order

1. **B1** (age_category) — unblocks both parent personas on Add Child  
2. **B2** (Family visibility) — restores Profile-first north-star  
3. **B3** (teen H2) — policy/safety  
4. **B6** (remove Marcus hardcode) — prevents regression masking  
5. **B4** (MY CLASSES gate) — cleans Today for R0/teen/coach  
6. **B5** (returnToInvite) — completes invite enrollment loop  

After P0/P1 land: re-run persona spot-checks for `parent-first-child`, `parent-via-class-invite`, `teen-restricted-account`, `player-no-coach-tools` before Validator queue.
