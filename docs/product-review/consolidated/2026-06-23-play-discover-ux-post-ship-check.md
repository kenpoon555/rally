# Post-ship check — play-discover-ux · 2026-06-23

**Build:** `dev` after PR [#68](https://github.com/kenpoon555/rally/pull/68)  
**Account:** `@kunyu` · iOS sim

## Tier 3 journeys (re-check)

| Journey | Pre-builder | Post-ship |
|---------|-------------|-----------|
| MRU strip (5 chips) | Fail | **Pass** — Running · Badminton · Racquetball · Volleyball · Table Tennis |
| More → picks stay visible | Fail | **Pass** — scroll strip; no More-only selection |
| Kill/relaunch MRU | Fail | **Pass** — Running selected + MRU order restored |
| Badminton first when selected | Fail | **Pass** |
| Running × Players | Pass | **Pass** — *No Running players posting yet* |
| B19 Recent in More | Deferred | **Pass** — Recent row (polish PR) |
| B12 Players title case | P3 | **Pass** — *No Running players posting yet* (not lowercase) |

## Screenshots

- `docs/contracts/screenshots/flow-play-screen/more-sheet-recent-section.png`
- `docs/contracts/screenshots/flow-play-screen/personalized-strip-after-mru.png` (prior validation)

## Persona verdict flip

All 4 tier-3 personas would **PASS** strip personalization on current `dev`. Pre-builder review files kept as historical FAIL evidence.
