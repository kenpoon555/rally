# Validation handoff — 2026-06-22 · onboarding-picky

**Queue:** `cps-onboarding`  
**Builder branch:** `fix/onboarding-picky-builder`  
**Synthesis:** [2026-06-22-onboarding-picky-synthesis.md](./2026-06-22-onboarding-picky-synthesis.md)

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --from flow-auth-onboarding --builder
```

**Flags:** `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION=true`, `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true`, `EXPO_PUBLIC_ENABLE_PARENT_PILOT=true`

---

## Contract validation order

| Order | Contract id | Why now | Tier 2 trigger |
|-------|-------------|---------|----------------|
| 1 | `flow-auth-onboarding` | **P0** legal gate silent failure | `player-no-coach-tools` fresh signup fail |
| 2 | `flow-age-gate-onboarding` | Signup `age_category` after B7 | Carry B1 |
| 3 | `flow-parent-family-onboarding` | B2 regression + fresh parent path | `parent-first-child` partial |
| 4 | `flow-teen-account-onboarding` | H2 probe green — regression guard | `teen-restricted-account` pass |
| 5 | `flow-become-a-coach` | Coach unlock path | `coach-approved-manual` pass |
| 6 | `flow-create-game` | **P1** coach class publish | `coach-first-class` fail |
| 7 | `flow-coach-onboarding-org` | CLASSES I TEACH for real coaches | `coach-first-class` |
| 8 | `flow-student-class-enrollment` | Invite path + B8 prerequisite | `parent-via-class-invite` |
| 9 | `flow-parent-guardian-consent` | Assert legal blocker only — not E2E enroll | Documented stop |

---

## Persona spot-checks (after builder)

| Persona | Must re-prove |
|---------|----------------|
| `player-no-coach-tools` | Fresh signup through legal gate → no coach/parent surfaces |
| `coach-first-class` | Create Class → parent enroll share (non-Marcus) |
| `teen-restricted-account` | H2 probe after any coachParentService edits |
| `parent-via-class-invite` | Fresh parent + class-enroll after B7+B1 |

---

## Known non-failures

- Guardian consent **legal review in progress** — pass when explicit
- Coach approval **requires relaunch** — document, do not fail v1
- Marcus demo classes — reference only; validator must use `@playerr0474532` for coach-first
