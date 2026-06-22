# Pre-approve review — play-discover · 2026-06-22

**Queue:** `play-discover-round1` tier 1 · **Reviewer:** pre-approve-review (Layer 1.5)  
**Inputs:** 6 persona reviews · consolidator pack · contract edits · `release-loops.json`

## Verdict

**approve_with_notes**

Human can approve synthesis + backlog + validation handoff. B3/B4 builder work is already on branch — prioritize **validation** before additional src PRs for B1/B2/B5.

---

## Coverage (persona → synthesis)

| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| `play-discover-minimalist` | Cross-sport fix pass; running copy P1; R0 Classes P1 | Yes (1, 3, 9) | B1, B3, B4 | None |
| `running-regular` | Running empty copy P1; More strip P2 | Yes (1, 6) | B1, B6, B7 | None |
| `badminton-casual` | Recency P1; empty discover P2; row tap P2 | Yes (2, 4, 7) | B2, B8, B10 | None |
| `basketball-first-timer` | Invite hint P1; segment clutter P2; Next Up P2 | Yes (5, 8) | B5, B9 | None |
| `player-no-coach-tools` | R0 Classes proof P1 | Yes (3) | B3 | None |
| `coach-parent-dual` | Classes segment pass | Yes (10) | — (proof only) | None |

**Coverage score:** 6/6. No silent P1 drops.

---

## Contract PR risk

| File | Change | Risk | Recommendation |
|------|--------|------|----------------|
| `flow-play-screen.md` | +4 checklist rows (sport empty, recency, first-timer) | **Low** | Observable in sim |
| `module-role-surfaces.md` | R0 demo account clarification | **Low** | Aligns with onboarding precedent |
| Builder B3/B4 | Already in `src/` | **Low** | Validate before merge |
| H1 recency | Product choice | **h_gate_fork** | Default **B)** subtitle change if no owner — cheaper than RPC filter |

**Conflict:** None with green onboarding contracts.  
**Creep:** None — all items trace to persona friction tables.  
**Timing:** Parallel-safe with GTM 2; does not block launch gate.

---

## Auto-pass eligibility

| Check | Result |
|-------|--------|
| All personas reviewed | Yes 6/6 |
| P0 blockers | None — P1 copy/validation only |
| Contract diffs applied | Yes (`flow-play-screen`, `module-role-surfaces`) |
| Human H gates | H1 optional — not blocking approve |

**Recommendation:** `approve_with_notes` → contract PR → validate `role-surface-audit` → Builder B1/B2/B5.

---

## Notes for human

1. Re-run `@kunyu` or fresh R0 during validation for `02-r0-no-classes-segment.png`.
2. B3/B4 marked shipped — **Validator must confirm** before closing play-discover builder round.
