# Rally loop status

_Updated: 2026-06-22 05:23 UTC_

**Release loop:** `onboarding-v1`

## 🔄 IN PROGRESS — next: spawn_src_pr

validation green — open src PR

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `onboarding-round2-picky` tier 2
- phase: `src_pr_pending` · status: `running`
- layer_2: `merged`
- personas: 6/6
- builder branch: `fix/onboarding-picky-builder`

## Validation

- queue: `cps-onboarding`
- contract: `flow-parent-guardian-consent` (9/9)
- phase: `done` · status: `pass`
- chain_enabled: False
- branch: `fix/onboarding-picky-builder`
- notes: VALIDATION_GREEN_ALL tier2 2026-06-22 — 9/9 cps-onboarding on fix/onboarding-picky-builder. P0 legal gate fresh signup; B1 age_category; B2 Family+consent; H2 teen hide; B8 coach_class_listings @playerr0474532 DB; guardian legal blocker documented.

---

## Commands

| Situation | Command |
|-----------|---------|
| Refresh this file | `./.cursor/hooks/rally-loop-status.sh` |
| Continue in chat | Say **continue** (orchestrator reads this file) |
| Approve pre-review | `./.cursor/hooks/product-review-loop-approve.sh` |
| Validation all green | `./.cursor/hooks/product-review-loop-validation-green.sh` |
| After src PR merge | `./.cursor/hooks/product-review-loop-src-pr-merged.sh` |

Round history: `docs/product-review/ROUND-LOG.md`
