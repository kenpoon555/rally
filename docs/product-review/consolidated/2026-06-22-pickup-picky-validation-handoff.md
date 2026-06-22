# Validation handoff — 2026-06-22 · pickup-picky

## Queue

- Validation queue: `gtm2-feedback-jun-2026`
- Source reviews: 4/4 personas completed for `pickup-round2-picky`

## Ordered contract run list

| Order | Contract | Why |
|------:|----------|-----|
| 1 | `flow-invite-to-rally` | Cross-persona P0 blocker in signed-out invite/auth handoff |
| 2 | `flow-rally-session` | Host/member Rally session validation depends on reliable auth entry |
| 3 | `flow-create-game` | Host create checks meaningful only after auth path is deterministic |

## Required evidence focus

- Signed-out invite opens auth gate and reliably resumes invite target post-auth.
- No silent stall on login submit.
- Host personas can reach create/session screens after auth.

## Start command

`./.cursor/hooks/validation-loop-start.sh --queue gtm2-feedback-jun-2026 --builder`
