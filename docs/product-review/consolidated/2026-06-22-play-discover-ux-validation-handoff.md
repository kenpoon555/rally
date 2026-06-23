# Validation handoff — play-discover-ux tier 3 · 2026-06-22

**Queue:** `play-discover-round3-ux` · **Tag:** `play-discover-ux`  
**Builder branch:** `fix/play-discover-ux-strip`  
**Fast re-check:** `play-discover-matrix` + tier 3 strip journeys

## Contract order

| Order | Contract id | Why |
|-------|-------------|-----|
| 1 | `flow-play-screen` | B16–B18 personalized strip + MRU |
| 2 | `module-sport-icon` | Empty hero regression (B11) |

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder
```

## Tier 3 proof required (new)

| Journey | Pass criteria |
|---------|---------------|
| MRU power host | More → Running → Racquetball → Soccer — **3+ sports visible** on strip without reopening More |
| `@kunyu` badminton | Badminton first when selected; attended sports fill strip — not forced PB/BB head |
| Strip size | Up to **5** sport chips; More only when catalog overflows |
| Persistence | Kill app → Play restores MRU strip order |
| Matrix regression | Running × Players — no cross-sport leak |

## Screenshots

| File | Capture |
|------|---------|
| `flow-play-screen/personalized-strip-after-mru.png` | 4–5 MRU sports on strip after multi More picks |
| Reuse matrix folder | Cross-sport segment checks |

## Persona verdict summary

All 4 personas **FAIL** pre-builder on personalization; **PASS** on tier 2 matrix items.
