# Rally loop status

_Updated: 2026-06-26 23:22 UTC_

## ▶️ QUEUED — contract `flow-rally-session` (1/6)

No agent running. Say **continue** OR use one Agent chat with **stop hook** enabled (Settings → Hooks).

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `taste-tier6-join-loop` tier 6
- phase: `validation_spawned` · status: `running`
- layer_2: `merged`
- personas: 8/8
- builder branch: `fix/taste-tier6-builder`

## Validation

- queue: `taste-tier6`
- contract: `flow-rally-session` (1/6)
- phase: `started` · status: `running`
- chain_enabled: True

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
