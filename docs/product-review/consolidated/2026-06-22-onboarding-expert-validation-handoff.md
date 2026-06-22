# Validation handoff — 2026-06-22 · onboarding-expert

**Queue:** `cps-onboarding`  
**Branch:** `dev` (no new builder branch — tier 3 regression)  
**Synthesis:** [2026-06-22-onboarding-expert-synthesis.md](./2026-06-22-onboarding-expert-synthesis.md)

## Start command

```bash
cd RallyApp
git checkout dev && git pull
./.cursor/hooks/validation-loop-start.sh --queue cps-onboarding --from module-coach-parent-navigation --builder
```

**Flags:** `EXPO_PUBLIC_ENABLE_COACH_FOUNDATION=true`, `EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE=true`, `EXPO_PUBLIC_ENABLE_PARENT_PILOT=true`

---

## Contract validation order (tier 3 regression)

| Order | Contract id | Why now | Tier 3 trigger |
|-------|-------------|---------|----------------|
| 1 | `module-coach-parent-navigation` | Dual-role regression | `coach-parent-dual` |
| 2 | `flow-organization-coaches` | v1 boundary only | `academy-head-coach` |
| 3 | `flow-coach-class-operations` | No substitute regression | carry green |
| 4 | `flow-create-game` | B8 sim proof depth | `coach-first-class` P2 |
| 5 | `flow-student-class-enrollment` | Invite + `returnToInvite` carry | `parent-via-class-invite` |
| 6 | `flow-parent-guardian-consent` | Lawyer gate documented stop | not E2E enroll |

**Optional full queue:** Re-run all 9 `cps-onboarding` contracts if any `coachParentService` / legal gate edits land before tier 3 close.

---

## Persona spot-checks

| Persona | Must re-prove |
|---------|----------------|
| `coach-parent-dual` | Marcus — Family + Coach Tools + Today MY CLASSES + CLASSES I TEACH |
| `academy-head-coach` | Grep + walk — no org UI, no academy promises |
| `coach-first-class` | `@playerr0474532` — Create Class → ClassDetail share CTA (sim screenshot) |
| `parent-via-class-invite` | Class-enroll picker with seeded parent; lawyer gate on inline add |

---

## Known non-failures

- Guardian consent **legal review in progress**
- Coach approval **requires relaunch** after SQL flip
- Marcus demo classes — reference for dual-role; coach-first must use `@playerr0474532`

---

## When green

```bash
./.cursor/hooks/product-review-loop-validation-green.sh
# If no src changes: mark tier 3 complete via product-review-loop-src-pr-merged.sh with note "docs-only"
```
