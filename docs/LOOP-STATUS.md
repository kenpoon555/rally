# Rally loop status

_Updated: 2026-06-28 06:02 UTC_

## 👤 WAITING ON YOU — approve pre-review

Run `./.cursor/hooks/product-review-loop-approve.sh` in this chat (or terminal).

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `tier0-join-loop` tier 0
- phase: `review_done` · status: `awaiting_human`
- layer_2: `None`
- personas: 2/1
- builder branch: `fix/ name)-builder`

## Validation

- queue: `class-response`
- contract: `module-coach-parent-navigation` (2/2)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: PASS (code audit) fix/class-response-builder @ 26a893b. CR1-CR5 verified; Message coach routes to class chat surface (live two-way thread deferred — infra); sim screenshots deferred (Metro/standalone blocker); noBetaSurfaces guard passed live.

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
