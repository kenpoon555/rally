# Validation handoff — play-discover-picky tier 2 · 2026-06-22

**Queue:** `play-discover-round2-picky` · **Tag:** `play-discover-picky`  
**Fast re-check:** `play-discover-matrix` (B7/B11) — **green** 2026-06-22  
**Full audit (optional):** `role-surface-audit`

## Contract order

| Order | Contract id | Why |
|-------|-------------|-----|
| 1 | `flow-play-screen` | Sport matrix + empty states + B7/B11 |
| 2 | `module-role-surfaces` | R0 segment gate + sport × Players |
| 3 | `module-sport-icon` | Empty hero icon (B11) |

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder
```

For full role audit after merge:

```bash
./.cursor/hooks/validation-loop-start.sh --queue role-surface-audit --from module-role-surfaces --builder
```

## Proof already on branch

- `docs/contracts/screenshots/flow-play-screen/off-strip-sport-in-strip.png`
- `docs/contracts/screenshots/flow-play-screen/discover-empty-icon-aligned.png`
- Persona screenshots under `docs/product-review/play-sport-matrix-auditor/2026-06-22/`

## Tier 2 persona verdict

All 4 personas **pass** play-discover contract focus. No new validator rows required beyond round 1 + B7/B11 checklist.
