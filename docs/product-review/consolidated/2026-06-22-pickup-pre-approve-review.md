# Pre-approve review — pickup · 2026-06-22

**Queue:** `pickup-round1` tier 1 · **Verdict:** **approve_ready**

## Coverage

| persona-id | In synthesis? | In backlog? | Gap |
|------------|---------------|-------------|-----|
| `basketball-first-timer` | Yes (theme 1) | B1 | None |
| `badminton-casual` | Yes | — | None |
| `badminton-host` | Yes (theme 2) | B2 | None |
| `pickleball-first-timer` | Yes | B1 | None |
| `volleyball-host` | Yes | B2 | None |
| `multi-sport-power-host` | Yes | B1 | None |

**Coverage score:** 6/6 personas represented. No silent drops.

## Contract PR risk

| File | Risk | Recommendation |
|------|------|----------------|
| `flow-invite-to-rally.md` | Low | Aligns with existing validator partial report |
| `flow-create-game.md` | Low | Schedule P0 already in open issues |
| `flow-play-screen.md` | Low | Copy-only P2 |
| *(none)* | none — | No scope creep |
| *(none)* | parallel-safe | Independent of onboarding CPS |

**Conflict check:** Compatible with onboarding green rows.

## Human approve checklist

- [ ] Verdict: **approve_ready**
- [ ] Contract PR: `docs/pickup-contracts-product-review`
