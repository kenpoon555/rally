# Validation handoff — taste-tier6 · 2026-06-26

**Source:** [2026-06-26-taste-tier6-synthesis.md](./2026-06-26-taste-tier6-synthesis.md)
**Queue:** `taste-tier6` · proves Tier 6 authoring changes shipped

## Ordered contract list

| Order | Contract id | Why now |
|-------|-------------|---------|
| 1 | `flow-rally-session` | RSVP banner, Confirm/Can't make, grouped roster |
| 2 | `flow-play-screen` | Personal-state chips + urgency hook on discover |
| 3 | `flow-game-room` | Player day-of card vs host ops split |
| 4 | `flow-post-game-attendance` | Host attendance vs player rejoin path |
| 5 | `module-game-card` | Detail hero single-column decision layout |
| 6 | `module-visual-design-system` | Status banner token (if J9 shipped) |

## Start command

```bash
./.cursor/hooks/validation-loop-start.sh --queue taste-tier6 --builder
```

## Prerequisites

- Contract PR from `docs/taste-tier6-contracts-product-review` merged to `dev`
- Builder branch `fix/taste-tier6-builder` implements J1–J7 minimum (P0 + P1)
- Demo: `marcus@rally-mvrhoops.demo` + `@kunyu` member on seeded session

## Screenshot folders

`docs/product-review/taste-*/2026-06-26/` (persona reviews) + validator captures under `docs/contracts/screenshots/`
