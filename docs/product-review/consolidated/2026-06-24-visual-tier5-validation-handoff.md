# Validation handoff — visual-tier5 · 2026-06-24

**Source:** [2026-06-24-visual-tier5-synthesis.md](./2026-06-24-visual-tier5-synthesis.md)  
**Queue:** `visual-tier5` · designer sign-off bar

## Ordered contract list

| Order | Contract id | Why now |
|-------|-------------|---------|
| 1 | `module-visual-design-system` | New tier-5 module — CTA, empty, strip, screenshots |
| 2 | `flow-auth-onboarding` | Welcome/auth CTA + signup spacing |
| 3 | `flow-play-screen` | Strip, segment, empty states |
| 4 | `flow-inbox` | Chips, rows, empty icon |
| 5 | `module-game-card` | Truncation, sport meter |
| 6 | `flow-profile` | Identity + rate queue |
| 7 | `flow-game-room` | Poll UI + CTAs |

## Start command

```bash
./.cursor/hooks/validation-loop-start.sh --queue visual-tier5 --builder
```

## Screenshot folders

`docs/product-review/visual-*/2026-06-24/`

## Prerequisites

- Contract PR from `docs/visual-tier5-contracts-product-review` merged
- Builder branch `fix/visual-tier5-builder` implements B1–B7 minimum
