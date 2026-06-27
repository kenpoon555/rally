# Rally loop status

_Updated: 2026-06-27 00:08 UTC_

## 🔄 IN PROGRESS — next: spawn_contract_pr

auto-pass (approve_with_notes) — contract PR next

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `theme-explore-round1` tier 6
- phase: `contract_pr_pending` · status: `approved`
- layer_2: `pending`
- personas: 1/1
- builder branch: `fix/ name)-builder`

## Validation

- queue: `taste-tier6`
- contract: `module-visual-design-system` (6/6)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: VALIDATION_GREEN_ALL taste-tier6 · 2026-06-26 · fix/taste-tier6-builder @ 048f2ef. Code audit + fixer round 1 (banner placement, chip wiring). Sim live screenshots deferred — dev client Metro disconnect.

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
