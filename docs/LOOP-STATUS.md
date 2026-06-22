# Rally loop status

_Updated: 2026-06-22 01:39 UTC_

**Release loop:** `onboarding-v1`

## 🔄 IN PROGRESS — next: 

Agent should run chain-next and continue.

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `onboarding-round1` tier 1
- phase: `src_pr_pending` · status: `running`
- layer_2: `merged`
- builder branch: `fix/onboarding-builder-b1-b6`
- src PR: https://github.com/kenpoon555/rally/pull/45

## Validation

- queue: `cps-onboarding`
- contract: `module-coach-parent-navigation` (8/8)
- phase: `done` · status: `pass`
- chain_enabled: False
- branch: `fix/onboarding-builder-b1-b6`
- notes: VALIDATION_GREEN 2026-06-22 — flags-on navigation; B2/B3/B4 cross-contract proof

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
