# Validation handoff — play-discover tier 2 UX · 2026-06-22

**Source:** Post–round 1 sim review (Racquetball via More)  
**Queue:** `play-discover-matrix` (fast) or full `role-surface-audit`  
**Builder backlog:** B7, B11 in [2026-06-22-play-discover-builder-backlog.md](./2026-06-22-play-discover-builder-backlog.md)

## Failures to fix

| ID | Contract | Issue | Expected |
|----|----------|-------|----------|
| B7 | `flow-play-screen` | Off-strip sport not in quick strip | More → Racquetball: slot 3 shows Racquetball icon + label selected; list/empty copy still Racquetball-scoped |
| B11 | `module-sport-icon` | Empty-state hero icon misaligned | Plain centered glyph OR 56px circle — no offset square `primaryLight` block |

## Sport selection model (contract)

- **Last selected** → `preferred_sports[0]` on profile (already written on filter change).
- **No prior selection** → `getDefaultLaunchSportName()` (Pickleball).
- **Strip UX** → swap slot 3 when active sport is off-strip (mirror `CreateActivityScreen.sportBarSports`).

## Start command

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder
```

Validator will fail rows #15–17 on `flow-play-screen` and row #1 on `module-sport-icon` → Fixer implements B7/B11 → re-validate.

## Screenshots required

| Path | Capture |
|------|---------|
| `flow-play-screen/off-strip-sport-in-strip.png` | Racquetball (or Running) visible in strip slot 3 |
| `flow-play-screen/discover-empty-icon-aligned.png` | Empty Games — hero icon centered |

## Optional product review

Tier 2 personas (`play-discover-round2-picky`) can run after matrix green — not required to ship B7/B11.
