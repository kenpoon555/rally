# Rally loop status

_Updated: 2026-06-22 07:39 UTC_

**Release loop:** `sport-meetup`

## 💤 IDLE — no active self-chain

Say **continue** in orchestrator chat or run `./.cursor/hooks/rally-loop-status.sh`.

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `sport-meetup` tier 1
- phase: `src_pr_pending` · status: `running`
- layer_2: `merged`
- personas: 1/1
- builder branch: `fix/sport-meetup-builder`
- src PR: https://github.com/kenpoon555/rally/pull/51

## Validation

- queue: `sport-meetup-launch`
- contract: `module-sport-icon` (4/4)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: ['Running icon visible in All sports picker and create sport row (sim).', 'Workout icon in picker N/T — launchEnabled false per H3.']

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
