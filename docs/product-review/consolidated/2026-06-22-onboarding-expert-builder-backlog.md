# Builder backlog — 2026-06-22 · onboarding-expert

**Source:** [2026-06-22-onboarding-expert-synthesis.md](./2026-06-22-onboarding-expert-synthesis.md)  
**Queue:** `onboarding-round3-expert` tier 3  
**Prior backlog:** [2026-06-22-onboarding-picky-builder-backlog.md](./2026-06-22-onboarding-picky-builder-backlog.md) (B7–B9 — **shipped** PR #47)

---

## P0 — Ship blockers

*(none — tier 3 expert found no new P0)*

---

## P1 — Ship items

*(none — B8 and B7 resolved in tier 2 builder)*

---

## P2 — Validation / proof depth (not builder)

| ID | Item | Contract | Notes |
|----|------|----------|-------|
| V1 | Sim E2E: `@playerr0474532` Create Class → ClassDetail + parent enroll share | `flow-create-game` | DB proof exists; capture screenshot |
| V2 | Dual-role Marcus regression after `coachParentService` edits | `module-coach-parent-navigation` | Today + Profile sections |
| V3 | v1 org boundary absence check | `flow-organization-coaches` | No UI / no academy copy |

---

## P3 — Copy polish (defer)

| Item | Notes |
|------|-------|
| Create screen title **Create Game** when `createMode === 'class'` | Cosmetic — not tier 3 blocker |

---

## Do not regress (spot-check in validation)

| Item | Original | Tier 3 guard |
|------|----------|--------------|
| B7 Legal gate | tier 2 | Fresh signup smoke |
| B8 Coach class listing | tier 2 | Non-Marcus coach |
| B2–B4 Family / teen / Today gates | tier 1–2 | Marcus + teen H2 |
| B9 Teen class invite | tier 2 | Code path unchanged |
| Lawyer guardian gate | documented | Explicit pass when blocked |

---

## Builder agent instruction

**Skip Layer 2b Builder** unless human adds scope. After contract PR merges:

1. Run validation regression per [validation-handoff](./2026-06-22-onboarding-expert-validation-handoff.md) on `dev`
2. If all green → `./.cursor/hooks/product-review-loop-validation-green.sh` with notes "tier3 regression only"
3. No src PR required when backlog empty
