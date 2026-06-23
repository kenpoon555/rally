# Builder backlog — play-discover-ux tier 3 · 2026-06-22

**Source:** [play-ux-personalization-auditor/2026-06-22-review.md](../play-ux-personalization-auditor/2026-06-22-review.md) + tier 3 persona queue  
**Queue:** `play-discover-round3-ux` tier 3  
**Tag:** `play-discover-ux` · **Branch:** `fix/play-discover-ux-strip` · **Status:** in progress (B16–B18 implemented 2026-06-22)  
**Validation queue:** `play-discover-matrix` (re-run after B16–B18)

## P0 — Strip personalization (blocks tier 3 close)

| ID | Priority | Item | Contract | Likely files | Notes |
|----|----------|------|----------|--------------|-------|
| B16 | P0 | Personalized Play strip from MRU + `orderSportsAttended` | `flow-play-screen` | `HomeScreen.tsx`, new `buildPlayStripSports.ts` | Slots 1–2 must not stay global PB/BB for Badminton-first users |
| B17 | P1 | Extend visible strip to 4–5 sports; More = overflow only | `flow-play-screen` | `DiscoverSportFilters.tsx`, `PLAY_STRIP_SPORT_MAX` | User request: grow row until limit |
| B18 | P1 | `preferred_sports` MRU array (max 5) on profile | `flow-play-screen` | `userService`, profile schema / `updateUserProfile` | Today only `[lastSport]` |

## P1 — Strip polish

| ID | Priority | Item | Contract | Likely files | Notes |
|----|----------|------|----------|--------------|-------|
| B19 | P2 | SportPickerSheet **Recent** section above All sports | `flow-play-screen` | `SportPickerSheet.tsx` | Power-host + casual persona |
| B20 | P2 | Shared strip builder for Play + Create Game | `flow-play-screen` | `CreateActivityScreen.tsx`, shared util | Parity with `sportBarSports` |

## Carry from tier 2 (optional — same release or defer)

| ID | Priority | Item | Contract | Notes |
|----|----------|------|----------|-------|
| B12 | P3 | Capitalize sport in Players empty title | `flow-play-screen` | *No running players* |
| B13 | P2 | Promote invite hint on empty Discover | `flow-play-screen` | Pickleball first-timer |
| B14 | P2 | Free-agent recency filter or subtitle | `flow-play-screen` | badminton-casual P1 |
| B15 | P2 | Host card title sanity for basketball seed | `flow-play-screen` | *Morning pickup run* |

## Shipped (tier 1–2 — do not regress)

| ID | Item | PR |
|----|------|-----|
| B7 | Off-strip sport in strip slot 3 (minimum) | #61 |
| B11 | Empty-state hero icon aligned | #61 |

## Validation

```bash
cd RallyApp
./.cursor/hooks/validation-loop-start.sh --queue play-discover-matrix --from flow-play-screen --builder
```

New screenshot required: `flow-play-screen/personalized-strip-after-mru.png`

## Persona queue (4/4)

| Persona | Review |
|---------|--------|
| `play-ux-personalization-auditor` | [2026-06-22-review.md](../play-ux-personalization-auditor/2026-06-22-review.md) ✅ |
| `multi-sport-power-host` | [2026-06-22-tier3-review.md](../multi-sport-power-host/2026-06-22-tier3-review.md) ✅ |
| `badminton-casual` | [2026-06-22-tier3-review.md](../badminton-casual/2026-06-22-tier3-review.md) ✅ |
| `play-discover-minimalist` | [2026-06-22-tier3-review.md](../play-discover-minimalist/2026-06-22-tier3-review.md) ✅ |
