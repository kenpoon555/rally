# Product review synthesis — 2026-06-27 · tier0-join-loop

**Queue:** `tier0-join-loop` (Tier 0 — dogfood / build-truth triage) · **Build:** `fix/class-response-builder` on Android `emulator-5554` (iOS blocked — stale session).
**Nature:** Tier 0 is the **router**. Unlike T1–T6, the two top findings were caught by *using the real build* and **already fixed this cycle** (code + the contract gaps they exposed). Remaining items are routed to backlog / H gates.

## Reviews included
| persona-id | date | file |
|------------|------|------|
| `dogfood-triager` | 2026-06-27 | [review](../dogfood-triager/2026-06-27-review.md) |
| `state-matrix-skeptic` | 2026-06-27 | [review](../state-matrix-skeptic/2026-06-27-review.md) |

## Top pain themes (ranked)
| Rank | Theme | Personas (n) | Severity | Example / screen | Status |
|------|-------|--------------|----------|------------------|--------|
| 1 | **Derived-count consistency** — one number, one source | 2/2 | P1 | Discover card "5 left" **vs** "9 spots left" same card | ✅ Fixed (`GameListCard`) + contract rule |
| 2 | **Viewer-state action gating** — member surfaces only for members | 2/2 | P1 | Non-member saw "Open Game Room" + "Request to Join" | ✅ Fixed (`isGameMember`) + contract matrix |
| 3 | **Ready-count semantics** | 1/2 | P2 | Detail "1 of 1 marked ready" vs WHO'S GOING 3 + 3 green dots | ⬜ Open → contract row |
| 4 | **Cross-surface count labels** | 1/2 | P2 | Discover "5 left" (min-to-start) vs detail "7 spots open" (open-to-cap) | ⬜ Open → H gate |
| 5 | **Home Next Up time source** | 1/2 | P3 | Today header "4:50 PM" vs card "5:00 PM" | ⬜ Open → backlog |
| 6 | **State-matrix test fixture gap** | 1/2 | P3 | Member/host/pending states only code-audited (single login) | ⬜ Open → demo-setup row |

## Recommended contract changes
| Priority | Contract file | Change type | Proposed diff summary | Status |
|----------|---------------|-------------|-----------------------|--------|
| P1 | `module-game-card` | rule + audit row | Derived counts single source of truth; urgency hook = time only | ✅ Applied |
| P1 | `flow-game-room` | matrix + checklist | Viewer-state × visible-actions; "Open Game Room ⊥ Request to Join" | ✅ Applied |
| P2 | `flow-rally-session` | checklist row | Define ready-count source so "N of M marked ready" == WHO'S GOING/dots | ⬜ Backlog (CR-T0-1) |
| P2 | `module-game-card` | clarify (H gate) | Resolve "left" vs "open" label meaning across surfaces | ⬜ H1 |
| P3 | `flow-today-home` (TBD) | new/append | Single time source for Next Up header + card | ⬜ Backlog (CR-T0-3) |
| P3 | `flow-game-room` | demo-setup row | 3-viewer fixture (host/member/non-member) for live state-matrix | ⬜ Backlog (CR-T0-4) |

## Builder backlog (Layer 2 → Builder)
See [builder backlog](2026-06-27-tier0-join-loop-builder-backlog.md). CR-T0-1..4 (P2/P3). CR-T0-A/B (P1) already implemented this cycle.

## Validation handoff (Layer 3)
See [validation handoff](2026-06-27-tier0-join-loop-validation-handoff.md).

**Start command:** `./.cursor/hooks/validation-loop-start.sh --queue class-response --builder`

## Out of scope (this cycle)
- Live verification of host/pending/finalized states (needs multi-account fixture — CR-T0-4)
- class-response `TodayMyClassesCard` re-walk on parent account (covered by class-response-round1 audit)
- iOS stale-session bootstrap UX (environment, not a build regression)

## Human decisions needed (H gates)
| ID | Question | Options |
|----|----------|---------|
| **H1** | Discover "5 left" means *min-to-start* (server `missing_players`); detail "7 spots open" means *open-to-capacity*. Same game, two numbers. | **A)** Distinct labels ("5 to start" vs "7 open") · **B)** Unify everywhere to open-to-capacity · **C)** Defer (keep, document) |
| **H2** | "N of M marked ready" — what is **M**? | **A)** M = WHO'S GOING (all on roster) · **B)** M = roster_min (need-to-start) · **C)** Drop the "of M", show "N ready" |
