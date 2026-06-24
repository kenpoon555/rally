# Rally loop status

_Updated: 2026-06-24 06:29 UTC_

**Release loop:** `cross-surface-tier4-jun-2026`

## 💤 IDLE — no active self-chain

Say **continue** in orchestrator chat or run `./.cursor/hooks/rally-loop-status.sh`.

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `cross-surface-tier4-round1` tier 4
- phase: `src_pr_pending` · status: `running`
- layer_2: `merged`
- personas: 8/8
- builder branch: `fix/cross-surface-tier4-builder`

## Validation

- queue: `cross-surface-tier4`
- contract: `flow-push-notifications-device` (8/8)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: Queue complete; push device E2E out of scope on sim

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
