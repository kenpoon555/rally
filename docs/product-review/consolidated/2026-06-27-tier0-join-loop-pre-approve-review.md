# Pre-approve review — tier0-join-loop · 2026-06-27

## Verdict
**approve_with_notes**

P1 contract diffs (`module-game-card`, `flow-game-room`) are observable, conflict-free, and already proven live — ready to validate. **Two founder decisions (H1, H2) gate the deferred P2 builder items (CR-T0-1/2) and should be answered before that work** — they do **not** block the P1 diffs.

## Coverage (persona → synthesis)
| persona-id | P0/P1 themes | In synthesis? | In backlog? | Gap |
|------------|--------------|---------------|-------------|-----|
| `dogfood-triager` | derived-count consistency (P1); ready-count (P2); cross-surface labels (P2); Next Up time (P3) | Yes (themes 1,3,4,5) | Yes (CR-T0-A,1,2,3) | None |
| `state-matrix-skeptic` | viewer-state gating (P1); state-fixture gap (P3) | Yes (themes 2,6) | Yes (CR-T0-B,4) | None |

No silent drops. P3 deferrals (Next Up time, state fixture) are documented, not dropped.

## Contract PR risk
| File | Change | Risk | Recommendation |
|------|--------|------|----------------|
| `module-game-card` | Derived-count single-source rule + audit row | **Low** | None — observable; matches live-verified fix |
| `flow-game-room` | Viewer-state × visible-actions matrix + mutual-exclusivity invariant | **Low** | None — do not contradict green rows; live-verified both sides |
| `flow-rally-session` | Ready-count source row (CR-T0-1) | **Not written yet** | Blocked on H2 — write after decision |
| `module-game-card` | "left" vs "open" label resolution (CR-T0-2) | **Not written yet** | Blocked on H1 — write after decision |
| `flow-today-home` | Single time-source (CR-T0-3) | **Not written yet** | Low risk; contract is TBD — parallel-safe |

**Conflict check:** P1 diffs are compatible — they do not contradict green Validator rows (they add a new rule + a new matrix). No GTM/launch timing risk (no launch-week scope). No new infra → $0.

## Concerns for human (read before approve)
- **H1 — label semantics:** Discover says "5 left" (server min-to-start) while detail says "7 spots open" (live open-to-capacity) for the same game. Which meaning do we standardize, and do we keep two labels? (A: distinct labels · B: unify to open-to-capacity · C: defer)
- **H2 — ready-count:** In "N of M marked ready", what is **M** — all on roster, or roster_min? The live "1 of 1 marked ready" vs WHO'S GOING 3 looks wrong under either reading. (A: M = on-roster · B: M = roster_min · C: drop "of M")
- These two gate **CR-T0-1 / CR-T0-2 only**. CR-T0-A/B (the P1 fixes already on the branch) can validate independently of H1/H2.

## Suggested additions (optional)
- After H1/H2, add the resolved rows to `flow-rally-session` and `module-game-card`.
- Add a 3-viewer seed fixture (CR-T0-4) so future state-matrix rows are live-verifiable, not code-audited.

## Human approve checklist
- [ ] I accept verdict: approve_with_notes
- [ ] Decide H1 (count-label meaning)
- [ ] Decide H2 (ready-count M)
- [ ] Contract PR scope: P1 diffs now (module-game-card, flow-game-room); P2 rows after H1/H2
