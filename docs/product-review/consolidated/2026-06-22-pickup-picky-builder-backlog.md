# Builder backlog — 2026-06-22 · pickup-picky

Source synthesis: `docs/product-review/consolidated/2026-06-22-pickup-picky-synthesis.md`

## Priority backlog

| ID | Priority | Item | Contract | Suggested checklist row updates |
|----|----------|------|----------|---------------------------------|
| B1 | P0 | Persist pending deep link across auth and auto-resume to target destination | `flow-invite-to-rally` | Add signed-out deep-link -> auth -> target replay row with pass/fail |
| B2 | P1 | Make login submit action explicit and discoverable in invite-auth path | `flow-invite-to-rally` | Add UI actionability row (CTA visible/actionable/loading/error) |
| B3 | P1 | Expose deterministic failure state when auth submit does not complete | `flow-invite-to-rally`, `flow-rally-session` | Add "no silent stall" row with explicit error or progress |
| B4 | P1 | Re-verify host create/session flows after B1-B3 with same accounts | `flow-rally-session`, `flow-create-game` | Add dependency note that host validations are blocked until auth handoff passes |

## Suggested implementation notes (no src edits in this doc)

- Use existing deep-link queue behavior as baseline and make resume behavior mandatory for signed-out flows.
- Avoid relying on user re-opening deep links after login.
- Keep UX parity across first-timer and host personas to avoid role-specific dead ends.

## Validation command

`./.cursor/hooks/validation-loop-start.sh --queue gtm2-feedback-jun-2026 --builder`
