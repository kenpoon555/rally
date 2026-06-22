# Module — Meetup sports (Running · Workout)

**Contract id:** `module-sport-meetup-sports`  
**Status:** Stub — **Builder ready** (H gates locked 2026-06-22)  
**Related code:** `src/constants/sports.ts`, `CreateActivityScreen.tsx`, `useSportsCatalog.ts`, `SportIcon.tsx`, `sport_templates`, `locations` seeds  
**Parent:** [module-sport-game-modes.md](./module-sport-game-modes.md) · [sport-matching-profiles.md](../sport-matching-profiles.md)

## Purpose

Launch **non-court** sports where the host sets **time + ballpark meet area**; exact meet pin and pace/format are agreed in **Game Room chat** — not GPS route consensus in v1.

North-star: **Host publishes “Saturday 7am · Griffith Park area · easy 5K” → players join → chat pins exact lot/gate.**

## Current code state (Jun 2026)

| Sport | In `SportType` enum? | `launchEnabled` | Create UX today |
|-------|----------------------|-----------------|-----------------|
| **Running** | ✅ Yes | `false` | **Court picker** (wrong for meetup — same as basketball) |
| **Workout** | ❌ No | — | N/A |
| **Hiking** (reference) | ✅ Yes | `false` | Court picker; metadata already `locationStrictness: loose` |

**Gap:** `getCreateGameSubtitle()` knows loose meetup copy, but `CreateActivityScreen` still **requires a court/location row** — Builder must add a meetup location path before launch.

---

## Product model (v1 recommendation)

### What users agree on **in the app**

| Field | Running | Workout |
|-------|---------|---------|
| **Start time** | Fixed datetime (required) | Fixed datetime (required) |
| **Ballpark area** | Neighborhood, park name, or city area (required text or Places pin) | Gym name, park, or “South Pasadena area” |
| **Roster cap** | Host sets max (default 2–12) | Host sets max (default 4–16) |
| **Title / pace / format hint** | Listing title + optional pace note | e.g. “HIIT · all levels” |

### What users agree on **in chat** (not blocking publish)

- Exact corner, gate, track entrance, bathroom meet
- Pace groups, distance, loops vs out-and-back
- Equipment (mats, bands), circuit format
- Weather / cancel

### Location strategy (answers “running can be anywhere”)

**H1 decision (recommended default: option B):**

| Option | Behavior | Validator |
|--------|----------|-----------|
| **A — Text only** | Host types meet area; no map pin required | Publish without map selection |
| **B — Ballpark pin (recommended)** | Places search or pick from **suggested** routes/parks; pin is approximate | Publish with lat/lng; copy says “exact spot in chat” |
| **C — Strict track** | Must pick seeded popular route | Fail if no seed — too brittle for v1 |

**Do not** require full route GPX, mile splits, or in-app pace consensus in v1.

**Seeded popular tracks:** Optional Discover/create **suggestions** (Griffith Park loops, Rose Bowl path, Santa Monica stairs) — same pattern as courts, but **“Add meet spot”** always allowed. Seeds help Discover, not gatekeeping.

---

## Sport metadata (Builder target)

Add/update in `src/constants/sports.ts`:

| Field | Running | Workout |
|-------|---------|---------|
| `matchingProfile` | `fastFixed` | `groupDiscuss` |
| `launchEnabled` | `true` when H3 approved | `true` when H3 approved |
| `locationStrictness` | **`loose`** (change from `moderate`) | **`loose`** |
| `timeStrictness` | `moderate` | `moderate` |
| `miniTournamentEnabled` | `false` | `false` |
| `partnerDependent` | optional `true` for buddy runs | `false` |
| `defaultTotalPlayers` | 6 (group run) | 8 (class-style meetup) |
| `minPlayers` | 1 | 2 |
| `defaultSchedulingMode` | `fixed` | `fixed` |
| `shortLabel` | Running | Workout |
| `DEFAULT_LISTING_TITLES` | `Group run · easy pace` | `Outdoor HIIT · all levels` |

**Workout enum:** `SportType.WORKOUT = 'Workout'`

**Icon:** `SportIcon` — Running: `run` (exists). Workout: `dumbbell` or `weight-lifter` (MaterialCommunityIcons — pick one in Builder PR).

---

## Sport-specific (not the same as court sports)

| Topic | Court sports (Basketball…) | Running | Workout |
|-------|---------------------------|---------|---------|
| **Location UI** | Court list + map | Meet area + optional suggested routes | Meet area (park/gym) |
| **Publish gate** | Court required today | **Meet area required; court not** | Same |
| **Mini tournament** | Some sports | **Never** | **Never** |
| **Rotation pairing** | Doubles sports | **No** | **No** |
| **Geofence Discover** | Near court | Near meet pin / area radius | Same |
| **Cost note** | Court split common | Usually free | Sometimes donation |
| **Coach class path** | Class/clinic | Rare v1 | **Overlap** — bootcamp may use coach Class create instead of public Workout pickup (H2) |
| **Rally crew create** | Pickup (+ tourney some) | **Pickup only** | **Pickup only** |

**Workout vs Coach Class (H2):** Public **Workout** = open meetup (HIIT in the park). **Coach Class** = enrolled minors/adults with coach — keep separate; do not merge flows.

---

## DB / templates

Migration or seed add `sport_templates` rows:

```sql
-- Running: no tourney_formats; venue hints for meetup not court
-- Workout: idem
```

`venue_field_hints` examples:

- Running: `track`, `trail`, `neighborhood_loop`, `park_path`
- Workout: `park`, `outdoor_gym`, `studio`, `beach`

Optional seed `locations` / meetup_points for LA popular routes (not blocking).

---

## Human decision gates (H*)

| ID | Question | Recommended v1 |
|----|----------|----------------|
| **H1** | Running location UX | **B** — ballpark Places pin + “exact spot in chat”; optional route seeds |
| **H2** | What is Workout? | **General fitness meetup** (not gym membership booking) |
| **H3** | Launch both at once? | **Running first**, Workout +1 week after Running create path green |
| **H4** | Require map pin to publish? | **Yes (approximate)** OR text+area if Places fails — document in Builder |
| **H5** | Discover empty state | Show meetup sports when ≥1 seeded area OR host-added pin in city |

---

## Pass/fail checklist (Validator)

### Config

- [x] `Running` in `SportType` + `SPORT_METADATA` — SM2 on fix/sport-meetup-builder
- [x] `Workout` in `SportType` + metadata — SM3 enum (launch deferred per H3)
- [ ] Both appear in Play tab when `launchEnabled: true` — Running yes; Workout H3 defer
- [ ] `sportSupportsMiniTournament(running|workout)` → false
- [ ] `resolveUserDefaultSport('Workout')` falls back to default launch sport when off

### Create Game (meetup path)

- [x] Running create: **no** “pick a court” blocker — meet area step (SM1)
- [x] Subtitle uses meetup copy (`getCreateGameSubtitle` loose branch)
- [x] Host can publish with ballpark area without selecting basketball court
- [ ] Optional: suggested routes/parks list non-empty in LA seed (nice-to-have, not P0)
- [ ] Workout create: same meetup path; roster defaults 4–16 range
- [ ] Schedule picker works (same as [flow-create-game.md](./flow-create-game.md))

### Rally / modes

- [ ] Rally create for Running crew: **pickup only** (see [module-sport-game-modes.md](./module-sport-game-modes.md))
- [ ] Workout Rally: pickup only

### Discover / detail

- [ ] Discover card shows meet area name (not “court” label when sport is meetup)
- [ ] Game Room chat reachable; host can pin exact meet in chat
- [ ] Icons render on Today / Inbox / Discover (`module-sport-icon.md`)

### Out of scope (fail if shipped without new contract)

- [ ] GPS live tracking / route recording
- [ ] Pace calculator / splits leaderboard
- [ ] In-app vote on route
- [ ] Gym check-in / membership

## Performance requirements

| ID | Metric | Budget |
|----|--------|--------|
| P1 | Meet-area Places search | Same as court search |
| P2 | Publish without court DB row | Must succeed |

## Estimated monthly cost

**Δ @ 50 / 200 MAU:** $0 UI + metadata; optional Places autocomplete usage +$0–5 @ 200 MAU if meetup search volume grows.

## Screenshots required

`docs/contracts/screenshots/module-sport-meetup-sports/`

| File | State |
|------|-------|
| `01-running-create-meet-area.png` | Create — meet area, no court gate |
| `02-running-discover-card.png` | Discover listing |
| `03-workout-create-meet-area.png` | Workout create |
| `04-game-room-meet-pin-chat.png` | Chat coordinating exact spot |

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | ~~Create court-gated~~ — **SM1** meetup path shipped on `fix/sport-meetup-builder` | Engineering |
| 2026-06-22 | Workout enum added — **SM3**; launch after Running proof (H3) | Product |

## Related

- [flow-create-game.md](./flow-create-game.md)
- [module-sport-game-modes.md](./module-sport-game-modes.md)
- [module-sport-icon.md](./module-sport-icon.md)

## Validator report

| Item | Pass | Notes |
|------|------|-------|
