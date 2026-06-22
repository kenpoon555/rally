# Rally loop status

_Updated: 2026-06-22 07:27 UTC_

**Release loop:** `pickup-gtm2`

## 🔄 IN PROGRESS — next: 

Agent should run chain-next and continue.

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## Product review

- queue: `pickup-round2-picky` tier 2
- phase: `src_pr_pending` · status: `running`
- layer_2: `merged`
- personas: 4/4
- builder branch: `fix/ name)-builder`

## Validation

- queue: `gtm2-feedback-jun-2026`
- contract: `module-coach-parent-navigation` (9/9)
- phase: `done` · status: `pass`
- chain_enabled: False
- notes: ['Play → Classes segment available behind COACH_CLASSES_DISCOVER; Games/Players segments regression-free.', 'CPS navigation smoke pass on sim with coach flags as seeded for Marcus.']

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
