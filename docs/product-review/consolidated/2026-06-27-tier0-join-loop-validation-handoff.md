# Validation handoff — 2026-06-27 · tier0-join-loop

Layer 3 proves the **already-implemented P1 fixes** (CR-T0-A/B) against the contracts updated this cycle. CR-T0-1..4 are not yet built (H-gated / backlog) and are **out of scope for this validation pass**.

## Ordered contract list (Layer 3)
| Order | Contract id | Why now | Proof target |
|-------|-------------|---------|--------------|
| 1 | `module-game-card` | P1 — derived-count single source of truth (CR-T0-A) | Discover card: one spot number; urgency hook time-only; no contradicting counts |
| 2 | `flow-game-room` | P1 — viewer-state × visible-actions matrix (CR-T0-B) | Non-member: Request to Join only; member: Game Room reachable; mutual exclusivity |
| 3 | `flow-class-session-response` | carried — class-response build under test on same branch | Inline Confirm/Can't make it ≤2 taps; Message coach → class thread |

## Start command
```bash
./.cursor/hooks/validation-loop-start.sh --queue class-response --builder
```

## Notes for Validator
- Live evidence already captured (Android): `docs/product-review/tier0/screenshots/`, `docs/product-review/dogfood-triager/2026-06-27/`, `docs/product-review/state-matrix-skeptic/2026-06-27/`.
- Member/host/pending/finalized state rows are **code-audited only** (single-login emulator + iOS blocked) — accept code audit for those rows; full live matrix awaits CR-T0-4 fixture.
- Do **not** validate CR-T0-1..4 (not built; H-gated).
