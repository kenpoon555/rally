# Consolidated synthesis — theme-explore-round1 · 2026-06-26

**Queue:** theme-explore-round1 · tier 6 · tag `theme-explore`
**Reviews:** `theme-reviewer` (1/1) — [2026-06-26-review.md](../theme-reviewer/2026-06-26-review.md)
**Matrix:** [theme-rounds/2026-06-26/theme-matrix.md](../../redesign/theme-rounds/2026-06-26/theme-matrix.md)

## Outcome
A 3-candidate palette matrix (A Court Neon baseline · B Clean Sport · C Night Court) across 3 Join-Loop screens. This is a **direction-finding** round; output is a founder pick + a tightened visual-design contract, **not** src changes. Live capture deferred (Metro/standalone-build blocker; renders are mockups per plan).

## Top themes
1. **Hierarchy: one filled-primary per surface.** Both lime themes (A, C) suffer a lime-CTA vs lime-"You're in"-pill collision — the join action loses primacy. Fix is a contract rule, not a theme choice. *(P0)*
2. **Contrast discipline.** Lime fills must carry **dark** `onPrimary`; B's blue carries white. Reaffirm the gate so no future palette drifts. *(P1)*
3. **Two-signal clarity wins.** B's "blue = action / orange = live-now" separation reads cleanly and is the strongest hierarchy + easiest a11y pass → ship-candidate. *(direction)*
4. **Dark mode ≠ palette swap.** C needs a full token pass (dividers, status, disabled). Park as separate workstream. *(scope)*

## Per-theme verdict
| Theme | Verdict |
|-------|---------|
| B — Clean Sport | **Ship-candidate (iterate)** → validator contrast gate next |
| A — Court Neon | Keep as brand option; resolve primary-collision first |
| C — Night Court | Drop this round; revisit as dark-mode project |

## Recommended contract changes
- `module-visual-design-system`: add explicit **"one filled-primary action per surface; status uses tint, not solid fill"** rule; reaffirm `onPrimary`/`onAccent` contrast under the theming gate.
- `module-game-card`: add **urgency-hook minimum-contrast** note.

## Human H gates
- **H1 — pick a direction** (B recommended) or request a fresh pitch to replace C. Required before any `theme.ts` work.
- No code ships from this queue until H1 + validator contrast gate pass.
