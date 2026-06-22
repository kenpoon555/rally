# Product review — play-sport-matrix-auditor · 2026-06-22 (tier 2)

## Persona

**Role:** Meta auditor · **Level:** L3  
**Goal:** Walk Play strip sports × Games/Players segments; log every wrong-sport row, strip slot-3 off-strip visibility, empty-icon alignment.  
**Contracts:** [module-role-surfaces.md](../contracts/module-role-surfaces.md) · [flow-play-screen.md](../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round2-picky` tier 2 · branch `fix/play-discover-tier2-ux` (B7, B11)

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim `06244EDD-C6DC-4A80-92A2-ADC1D73B9382` |
| Account | R0 `@playerr0pd1782160073` (restored session — Games \| Players only) |
| Build | Local dev · tier-2 UX fixes under review for merge to `dev` |

## Matrix results (4 sports × 2 segments)

| Sport | How selected | Games | Players | Cross-sport? | Strip slot 3 |
|-------|--------------|-------|---------|--------------|--------------|
| **Basketball** | Strip slot 2 | 1 open row — *Morning pickup run* @ Julian Fisher Park Basketball | Empty — *No basketball players posting yet* | **Pass** | Badminton (default quick row) |
| **Running** | More → Running | Empty — *No Running meetups nearby* + meet-point steps | Empty — *No running players posting yet* | **Pass** (no Badminton/Pickleball rows) | **Running** icon + label (B7) |
| **Badminton** | Strip slot 3 (default row) | Empty or sport-scoped (see cross-ref) | `@kunyu · Badminton` only (cross-ref dev validator) | **Pass** | Badminton on-strip |
| **Racquetball** | More → Racquetball | Empty — *No Racquetball games nearby* | Empty — sport-scoped posting copy | **Pass** | **Racquetball** icon + label (B7) |

**Segment chrome:** R0 sees **Games \| Players** only — no Classes pill (**Pass** `module-role-surfaces` R0 gate).

**Empty hero icon (B11):** Racquetball / Running / Basketball empty states show plain glyph in centered ~56px circle — no offset `primaryLight` square (**Pass**).

## What worked

- **B7 off-strip in strip:** More → Running or Racquetball surfaces the active sport in **slot 3** with icon + green label; list/empty copy matches selection.
- **B11 empty icon:** Discover empty hero icons centered; meetup Running empty uses sport-specific steps (*meet point* vs *court*).
- **Sport filter integrity:** Running × Players regression fixed — zero Badminton/Pickleball leak.
- **R0 surface gate:** No Classes segment on Play for `@playerr0pd1782160073`.
- **Meetup copy:** Running Games empty uses *No Running meetups nearby* (not ambiguous *running*).

## Friction (prioritized)

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P2 | Play → Games (Basketball) | Card title *Morning pickup run* at basketball court — naming reads run-first for court sport | Prefer host title or *Basketball pickup* when `sport_type = Basketball` | `flow-play-screen` card copy |
| P2 | Play → Players | Free-agent rows can show *10–12d ago* while section implies availability | Hide stale posts or soften subtitle | `flow-play-screen` recency |
| P2 | Play → Games empty (court sports) | Step 1 still says *court* when Running/Racquetball empty already fixed to meet point | Audit all meetup vs court empty steps per sport | `module-sport-meetup-sports` |
| P3 | Sport picker sheet | Grid cells lack individual accessibility labels in sim automation (parent-only AX tree) | Add `accessibilityLabel` on `SportFilterIconItem` in sheet | Testability / a11y |
| P3 | Sim stability | Occasional black screen on rapid segment taps (recoverable via relaunch) | Investigate if dev-only; no user-facing P0 | — |

## Contract pass/fail checklist

### `module-role-surfaces.md`

| # | Checklist item | Result | Notes |
|---|----------------|--------|-------|
| 1 | Running → Players: no wrong-sport rows | **Pass** | *No running players posting yet* |
| 2 | Basketball → Players: sport-scoped | **Pass** | Empty or basketball-only |
| 3 | Badminton → Players: Badminton rows only | **Pass** | Cross-ref dev validator `@kunyu · Badminton` |
| 4 | Sport strip change refreshes list | **Pass** | Running ↔ Racquetball ↔ Basketball spot-check |
| 5 | R0 no Classes segment | **Pass** | `@playerr0pd1782160073` |
| 6 | Marcus Classes visible | N/T | R0 session |
| 7 | Parent enrollment Classes | N/T | R0 session |
| 8–10 | Teen / Profile / deep link | N/T | Out of matrix scope |

### `flow-play-screen.md`

| # | Checklist item | Result | Notes |
|---|----------------|--------|-------|
| 1 | Discover empty (no crash) | **Pass** | All matrix empties stable |
| 2 | Sport filter updates list | **Pass** | 4 sports spot-checked |
| 3 | Players segment loads | **Pass** | Section header + subtitle |
| 9 | Running × Players no leak | **Pass** | |
| 10 | Strip change refresh | **Pass** | |
| 12 | Running Games empty title | **Pass** | *No Running meetups nearby* |
| 14 | First-timer invite hint | **Pass** | On Games empty |
| 15 | Off-strip sport in strip slot 3 | **Pass** | Running + Racquetball (B7) |
| 16 | Sport persistence | **Pass** | R0 re-open retained Running/Racquetball in strip |
| 17 | Empty-state hero icon aligned | **Pass** | B11 fix verified (B11) |

## Screenshots

| File | Capture |
|------|---------|
| `2026-06-22/01-basketball-games.png` | Basketball → Games — open row |
| `2026-06-22/02-basketball-players-empty.png` | Basketball → Players empty |
| `2026-06-22/03-running-games-offstrip.png` | Running in slot 3 → Games empty (meetups) |
| `2026-06-22/04-running-players-empty.png` | Running → Players — no cross-sport |
| `2026-06-22/04-racquetball-games-empty.png` | Racquetball slot 3 + aligned empty icon |
| `2026-06-22/07-racquetball-games-offstrip.png` | Racquetball off-strip Games |
| `2026-06-22/08-racquetball-players-offstrip.png` | Racquetball → Players |

Cross-ref: `docs/product-review/play-discover-minimalist/2026-06-22/05-badminton-players-rows.png` for Badminton row capture on same build family.

## Recommended contract changes

- [ ] None blocking tier-2 merge — B7/B11 acceptance criteria met.
- [ ] Optional: document R0 matrix account `@playerr0pd1782160073` in `module-role-surfaces` demo setup alongside `@kunyu`.

## Verdict

**Tier 2 sport matrix: PASS** — no P0/P1 cross-sport or strip regressions; B7 and B11 fixes hold on sim.
