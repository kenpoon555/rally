# Validation handoff — 2026-06-21 · onboarding

**Source:** [2026-06-21-onboarding-synthesis.md](./2026-06-21-onboarding-synthesis.md)  
**Queue:** `onboarding-round1` tier 1 → **`cps-onboarding`** (Layer 3)  
**Prerequisite:** Human approves synthesis + contract PR + Builder completes P0/P1 backlog

---

## Preconditions

- [ ] Human gate H4 cleared (`product-review-loop-approve.sh` or explicit approval)
- [ ] Contract diffs merged to `dev` (8 files — see synthesis “Recommended contract changes”)
- [ ] Builder items B1–B6 implemented and smoke-tested on sim
- [ ] Guardian legal gate still expected to block full enroll E2E — Validator should assert **explicit blocker**, not silent fail

---

## Ordered contract validation

Run contracts in this order so blockers surface before dependent flows.

| Order | Contract id | Why now | Persona evidence |
|-------|-------------|---------|------------------|
| 1 | `flow-age-gate-onboarding` | Signup must persist `age_category` before any parent/teen CPS flow | B1 — null category on fresh signup |
| 2 | `flow-parent-family-onboarding` | Profile-first parent path + Family empty state | `parent-first-child` P0 fails |
| 3 | `flow-teen-account-onboarding` | H2 policy — teen must never see coach surfaces | `teen-restricted-account` H2 fail |
| 4 | `flow-student-class-enrollment` | Invite → picker → inline add → resume | `parent-via-class-invite` |
| 5 | `flow-parent-guardian-consent` | Assert legal blocker copy when flag off (not enrollment success) | Both parent personas blocked at consent |
| 6 | `flow-become-a-coach` | Coach unlock after approval + relaunch | `coach-approved-manual` pass |
| 7 | `flow-coach-onboarding-org` | R0 hiding + MY CLASSES rules | `player-no-coach-tools` |
| 8 | `module-coach-parent-navigation` | Dual-role regression after hardcode removal | `coach-parent-dual` pass |

---

## Validation focus areas (from queue `contract_focus`)

| Contract id | Key assertions post-builder |
|-------------|----------------------------|
| `flow-become-a-coach` | Non-coach: no tools → SQL `is_coach=true` → relaunch → Coach Tools + Create Class |
| `flow-parent-family-onboarding` | Flag-on zero-child parent: Profile Family visible → Add Child → consent or legal blocker |
| `flow-coach-onboarding-org` | R0: no Coach Tools/Family on Profile; MY CLASSES hidden or neutral for non-parents |
| `flow-student-class-enrollment` | Deep link preview → empty picker → inline add → `returnToInvite` resume |
| `flow-teen-account-onboarding` | 13–17 signup → no CPS sections; H2 probe with `is_coach=true` still hidden |
| `module-coach-parent-navigation` | Marcus (or fresh dual-role): FAMILY + COACH TOOLS + distinct Today blocks |

---

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --builder
```

**Flags for onboarding validation runs:**

- Coach flows: `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION=true`
- Parent/teen flows: `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true`
- Parent pilot: `EXPO_PUBLIC_ENABLE_PARENT_PILOT=true` (parent personas)

Restart Metro after flag changes.

---

## Expected tier-1 outcomes after builder

| Flow | Expected Validator result | Known stop |
|------|---------------------------|------------|
| Parent Add Child → first profile | **Green to consent screen** | Full create blocked at lawyer gate |
| Class enroll E2E | **Green to consent / picker resume** | Enrolled confirmation N/A until legal |
| Teen restrictions | **Green** including H2 probe | — |
| R0 player hiding | **Green** after MY CLASSES gate | — |
| Coach manual approval | **Green** with relaunch note | No in-app apply (v1) |
| Dual-role Marcus | **Green** | Re-verify after B6 |

---

## Re-run persona spot-checks (recommended before Validator)

| Persona | Minimum re-check |
|---------|------------------|
| `parent-first-child` | Profile Family visible; Add Child reaches consent without “Adults only” |
| `parent-via-class-invite` | Inline add + returnToInvite after B5 |
| `teen-restricted-account` | H2 probe after B3; no MY CLASSES after B4 |
| `player-no-coach-tools` | No MY CLASSES parent copy on Today |

---

## Next tier (after green)

When `cps-onboarding` clears for round 1 scope:

```bash
./.cursor/hooks/product-review-loop-start.sh --queue onboarding-round2-picky
```

Tier 2 adds stricter rubric: journeys must complete without founder help (`requires_prior_queue: onboarding-round1`).
