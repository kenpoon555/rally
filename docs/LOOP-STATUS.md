# Rally loop status

_Updated: 2026-06-22 08:09 UTC_

## 📦 BATCH READY — open ONE combined PR

Branch `fix/overnight-jun-2026-batch` — all validation queues green. Agent runs `spawn_batch_pr` (no mid-loop PRs).

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `overnight-batch-jun-2026` tier —
- phase: `batch_pr_ready` · status: `running`
- layer_2: `local`
- builder branch: `fix/overnight-jun-2026-batch`

## Validation

- queue: `baseline`
- contract: `flow-play-screen` (5/5)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: ['baseline 5/5 sim pass — N/T rows documented in contract validator reports', 're-seed blocked: SERVICE_ROLE_KEY missing; SQL FK on profiles']

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
