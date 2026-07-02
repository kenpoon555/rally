# Rally loop status

_Updated: 2026-06-30_

## ▶️ QUEUED — contract `flow-rally-session` (1/6)

No agent running. Say **continue** OR use one Agent chat with **stop hook** enabled (Settings → Hooks).

_Works for any queue in release-loops.json (onboarding, pickup, sport-meetup, baseline validation)._

---

## What's left to build (as of 2026-06-30 audit)

All eng backlog items confirmed shipped. Remaining work:

1. **Coach announcement sender name** — small: `coach_display_name` missing from query + UI
2. **Theme palette pick** — founder decision → WCAG check → token swap in `theme.ts`
3. **Cross-surface tier 4 review** — 8 personas, full-app behavioral bar (not started)
4. **Visual tier 5 review** — after tier 4

## Previously running

- queue: `taste-tier6-join-loop` tier 6 — completed (PRs merged)
- queue: `taste-tier6` validation — completed

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
