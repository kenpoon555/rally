# Product review synthesis — 2026-06-22 · pickup-picky

## Reviews included

| persona-id | date | file |
|------------|------|------|
| basketball-first-timer | 2026-06-22 | `docs/product-review/basketball-first-timer/2026-06-22-review.md` |
| badminton-host | 2026-06-22 | `docs/product-review/badminton-host/2026-06-22-review.md` |
| volleyball-host | 2026-06-22 | `docs/product-review/volleyball-host/2026-06-22-review.md` |
| multi-sport-power-host | 2026-06-22 | `docs/product-review/multi-sport-power-host/2026-06-22-review.md` |

## Top pain themes (ranked)

| Rank | Theme | Personas (n) | Severity | Example screen |
|------|-------|--------------|----------|----------------|
| 1 | Signed-out invite/auth handoff is not deterministic | 4/4 | P0 | invite modal + login form progression |
| 2 | Login action hierarchy unclear in auth form | 3/4 | P1 | login screen title/CTA ambiguity |
| 3 | Host-tier workflows blocked by upstream auth completion | 3/4 | P1 | create/lock/nudge paths could not be exercised |
| 4 | First-timer copy context on invite return is weak | 1/4 | P2 | onboarding after deep-link dismiss |

## Recommended contract changes

| Priority | Contract file | Change type | Proposed diff summary |
|----------|---------------|-------------|----------------------|
| P0 | `docs/contracts/flow-invite-to-rally.md` | Checklist + required states | Add mandatory "pending deep link resumes to target after auth" and explicit signed-out CTA clarity |
| P1 | `docs/contracts/flow-rally-session.md` | Open issues + checklist dependency | Mark auth handoff as blocker prerequisite for Rally session persona coverage |
| P1 | `docs/contracts/flow-create-game.md` | Open issues dependency | Add auth-gate blocker note for host create-path validation in tier-2 picky queue |

## Builder backlog (Layer 2 -> Builder agent)

| Priority | Item | Contract | Likely files | Notes |
|----------|------|----------|--------------|-------|
| P0 | Ensure pending deep-link payload survives auth and resumes route | `flow-invite-to-rally` | `src/context/AuthContext.tsx`, `src/navigation/processDeepLink.ts`, auth routing glue | Must work for cold/warm starts |
| P1 | Clarify login CTA hierarchy for invite-driven auth | `flow-invite-to-rally` | auth screen component(s) | Explicit primary action and accessible semantics |
| P1 | Add deterministic success/failure feedback on auth submit | `flow-invite-to-rally`, `flow-rally-session` | auth view model + submit handler | No silent stalls |

## Validation handoff (Layer 3)

| Order | Contract id | Why now |
|-------|-------------|---------|
| 1 | `flow-invite-to-rally` | P0 cross-persona blocker for invite entry |
| 2 | `flow-rally-session` | Host/member Rally loop depends on auth handoff |
| 3 | `flow-create-game` | Host create path only meaningful after auth reliability |

**Start command:** `./.cursor/hooks/validation-loop-start.sh --queue gtm2-feedback-jun-2026 --builder`

## Out of scope (this cycle)

- Sport-specific visual polish not tied to invite/auth completion.
- Multi-Rally calendar/dashboard enhancements (non-blocking for GTM2 picky gate).
- Device push behavior (separate device-only queue).

## Human H gates

| ID | Question | Options |
|----|----------|---------|
| H1 | Should tier-2 queue hard-fail if host personas are blocked by shared auth issue? | A: yes (current recommendation) · B: allow partial with explicit carry |
| H2 | Should first-timer invite copy prefer "Game" over "Rally" in signed-out gate text? | A: keep mixed terminology · B: normalize to game-first copy for invite entry |
