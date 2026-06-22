# Pre-approve review — pickup-picky · 2026-06-22

## Verdict
**approve_with_notes**

## Coverage (persona -> synthesis)

| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| basketball-first-timer | invite/auth handoff P0; signed-out copy clarity P1 | Yes | Yes | None |
| badminton-host | login progression blocks host flow P0/P1 | Yes | Yes | None |
| volleyball-host | auth blocker prevents host validation P0/P1 | Yes | Yes | None |
| multi-sport-power-host | auth blocker prevents multi-crew validation P0/P1 | Yes | Yes | None |

## Contract PR risk

| File | Change | Risk | Recommendation |
|------|--------|------|----------------|
| `docs/contracts/flow-invite-to-rally.md` | Added explicit auth-CTA reliability checklist row + open issue | Low | Keep; this is observable and aligns with all 4 personas |
| `docs/contracts/flow-rally-session.md` | Added auth blocker dependency in open issues | Low | Keep; clarifies why host checks are currently blocked |
| `docs/contracts/flow-create-game.md` | Added auth prerequisite row + open issue | Low | Keep; prevents false-green create validation while auth is broken |
| `docs/product-review/consolidated/2026-06-22-pickup-picky-synthesis.md` | Consolidated findings and H gates | Low | Keep |

## Concerns for human (read before approve)

- Tier-2 queue is dominated by one shared blocker (auth handoff), so downstream host UX conclusions are limited until auth reliability is fixed.
- Validation order should stay invite -> rally session -> create game to avoid noisy false negatives.

## Suggested additions (optional)

- Add one explicit validator row in `flow-invite-to-rally` for "signed-out deep link + successful login lands on intended target without reopening link".
- If product wants strict queue semantics, enforce H1 default to hard-fail when host personas are blocked by shared infrastructure/auth defects.

## Human approve checklist

- [ ] I accept verdict: **approve_with_notes**
- [ ] Contract PR scope remains docs-only and focused on auth/invite reliability
- [ ] Validation run order follows the handoff document
