# Loops to run — consolidated (2026-06-26)

What the founder decision on 2026-06-26 created, and the exact order to run it.

## Decision recap
- **Keep** the core Join Loop. **Do not** run the pickup "steal" backlog (parked).
- **One product change:** student/parent **Next Class → "Can't make it" + "Message coach"** ([flow-class-session-response.md](../contracts/flow-class-session-response.md)).
- **Process:** +2 student personas, +8 taste personas (Tier 6), +1 theme-reviewer persona.

## Run order

| # | Loop (queue) | Tier | Personas (count) | Validates / Output |
|---|--------------|------|------------------|--------------------|
| 1 | `class-response-round1` | 1 | `student-cant-make-next-class`, `student-message-coach` (2) | [flow-class-session-response.md](../contracts/flow-class-session-response.md) — the new Next Class actions |
| 2 | `taste-tier6-join-loop` | 6 | `taste-want-it`, `taste-one-job`, `taste-first-3s`, `taste-best-in-class`, `taste-one-joy`, `taste-scope-skeptic`, `taste-authored`, `taste-momentum` (8) | Authoring verdicts on the 5 Join-Loop screens → [core-loop-redesign-spec.md](./core-loop-redesign-spec.md) |
| 3 | `theme-explore-round1` | 6 (generative) | `theme-reviewer` (1) | Themed-screenshot matrix → founder pick → validator contrast gate ([theme-exploration-plan.md](./theme-exploration-plan.md)) |

**Total new personas:** 2 student + 8 taste + 1 theme = **11**.
**Total new loops:** **3** (`class-response-round1`, `taste-tier6-join-loop`, `theme-explore-round1`).

## Suggested sequencing
1. **`taste-tier6-join-loop` first** — highest leverage; tells us *what* to change before we build. No code, no validator, no bug list — authoring verdicts only.
2. **`theme-explore-round1` in parallel** — independent of taste; produces directions for the founder to feel. Validator gates contrast before any palette ships.
3. **`class-response-round1` after the class feature is built** — this one *is* a buildable contract, so: build the Next Class actions → run the 2 student personas → validator.

## Quick-start prompts
- **Taste (run 8×, one persona each):** see [personas.md catalog G](../product-review/personas.md) one-line prompt.
- **Theme:** see [personas.md catalog H](../product-review/personas.md) one-line prompt.
- **Class response:** standard Tier 1 persona review against `flow-class-session-response`.

## Files touched by this decision
- `docs/redesign/core-loop-redesign-spec.md` — decision log added; steal list parked.
- `docs/redesign/theme-exploration-plan.md` — new.
- `docs/contracts/flow-class-session-response.md` — new.
- `docs/contracts/module-visual-design-system.md` — theming gate section.
- `docs/product-review/personas.md` — catalog B2 (2 student), catalog G → 8 taste, catalog H (theme-reviewer).
- `docs/product-review/review-queues.json` — 3 new queues.
