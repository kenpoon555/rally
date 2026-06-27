# Validation handoff — theme-explore-round1 · 2026-06-26

**Queue (Layer 3):** `theme-explore` · tag `theme-explore`

## Ordered contract list
1. `module-visual-design-system` — one-filled-primary rule (TM1) + contrast/theming gate (TM2)
2. `module-game-card` — urgency-hook contrast (TM3)

## Start command
```bash
./.cursor/hooks/validation-loop-start.sh --queue theme-explore --builder
```

## Prereqs / notes
- **Gated on H1 (founder pick).** Validation here proves the *chosen* palette against the contrast/`onPrimary`/`onAccent` rules **before** `theme.ts` is touched. Do not run until a direction is selected.
- This round produced **mockups** (Metro/standalone-build blocked live capture). Validator should record proof against the chosen palette's tokens; live screenshots captured after TS1 token swap.
- Screenshot folders: `docs/product-review/theme-reviewer/2026-06-26/` (candidates), `docs/redesign/theme-rounds/2026-06-26/` (matrix).
