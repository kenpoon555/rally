# Module contract — Game card

**Contract id:** `module-game-card`  
**Scope:** Detail hero + venue/session notes + preset wiring audit (phase2-game-card sprint)  
**Status:** Draft — narrowed for validation; list/session surfaces validated elsewhere  
**Config:** `src/config/gameCardLayouts.ts`  
**Shells:** `GameCardShell`, `RallySessionCard`, `GameCardDetailHero`  
**Actions:** `gameCardSessionActions.ts`, `useGameCardSessionActions.ts`  
**Cursor rule:** `.cursor/rules/rally-game-card.mdc`

## Purpose

One **preset-driven** game card family. Screens pick a **surface preset** (where the card appears in the app) — they do not fork layout or join semantics inline.

**This sprint validates only the delta** not already green in baseline: detail hero (pickup vs rally), venue/session/cost notes, and wiring invariants. List rows and session I'm-in/lock are covered by other contracts (see below).

## Theming (palette) — TM3

Personal-state chip ("You're in") and the **urgency hook** ("4 spots left · starts in 3h") must stay legible in **every shipped palette**:

- [ ] Urgency hook text meets WCAG AA contrast on the card `surface` in each palette (lime-on-white is the weak case — round 1 theme A; passes in B orange / C lime-on-dark).
- [ ] Personal-state chip uses a **tint** background, never a second solid `primary` fill (so it never competes with the join CTA — see `module-visual-design-system` "one filled-primary per surface").

> Source: theme-explore-round1 ([synthesis](../product-review/consolidated/2026-06-26-theme-explore-synthesis.md)).

## Already validated elsewhere (do not re-test in this sprint)

| Surface | Preset | Contract | Status |
|---------|--------|----------|--------|
| Discover open / locked | `discoverOpen`, `discoverLockedWelcoming` | [flow-play-screen.md](./flow-play-screen.md) | baseline ✅ |
| Today Next Up | `homeNextUp` | [flow-play-screen.md](./flow-play-screen.md) | baseline ✅ |
| My games row | `myGamesRow` | [flow-play-screen.md](./flow-play-screen.md) | baseline ✅ |
| Rally hub session card | `rallySession` | [flow-rally-session.md](./flow-rally-session.md) | baseline ✅ |
| Hub tabs / empty Play | — | [module-rally-hub.md](./module-rally-hub.md) | baseline ✅ |
| Game Room actions | — | [flow-game-room.md](./flow-game-room.md) | — |

## Layouts vs venue data (important)

**Layouts are not per physical location** (Julian Fisher Park vs another court). There is no saved layout per `location_id`.

| Concept | What it is | Where saved | Breaks if you change… |
|---------|------------|-------------|------------------------|
| **Surface preset** | Which card shell + join/share/icon flags for a **screen context** | `GAME_CARD_PRESETS` in `gameCardLayouts.ts` | Unit tests + this contract surfaces map |
| **Layout kind** | Visual shell: `listRow`, `homeNextUp`, `sessionInline`, `detailHero`, `mapTeaser` | Same preset map | `GameCardShell` dev warning if mismatch |
| **Venue content** | Court name, `VenueBlock`, distance line | Activity `location_id` + `location` join; `session_note` / `cost_note` on activity | Data/seed only — same preset layout |
| **List variant** | `open` / `locked_welcoming` / `my_game` row styling | Derived from preset + activity state (`gameListVariantFromPreset`) | `gameCardLayouts.test.ts` |

**Protection against regressions:**

1. **`GAME_CARD_PRESETS`** — single source of truth (`as const`); extend here, not on screens.
2. **`__tests__/gameCardLayouts.test.ts`** — preset helpers, share mode, list variants (run after preset edits).
3. **`.cursor/rules/rally-game-card.mdc`** — agents must read this contract before card changes.
4. **Shell components** — `GameCardShell` only accepts `listRow` / `homeNextUp`; session uses `RallySessionCard`; detail uses `GameCardDetailHero`.
5. **Cross-contract screenshots** — list/session behavior locked under flow-play-screen / flow-rally-session.

**Gap (deferred):** `mapTeaser` preset exists in config but **Map screen** (`MapScreen.tsx`) still uses ad-hoc `bottomCard` styles — not wired to `GameCardShell` / `mapTeaser`. Out of scope until map refactor.

## Surfaces map (call sites)

| Screen / component | Preset key | Shell | Wired? |
|--------------------|------------|-------|--------|
| `HomeScreen` Discover sections | `discoverOpen` / `discoverLockedWelcoming` | `GameCardShell` | ✅ |
| `NextUpCard` (Today) | `homeNextUp` | `GameCardShell` | ✅ |
| `MyGameListCard` | `myGamesRow` | `GameCardShell` | ✅ |
| `RallyPlayPanel` | `rallySession` | `RallySessionCard` → `CrewGameSessionCard` | ✅ |
| `ActivityDetailScreen` | `detailPickup` / `detailRally` (`detailPresetForActivity`) | `GameCardDetailHero` | ✅ |
| `MapScreen` bottom carousel | `mapTeaser` (planned) | — | ❌ ad-hoc UI |

## Presets (required registry)

| Preset key | Layout | Join mode | Share mode | Notes |
|------------|--------|-----------|------------|-------|
| `discoverOpen` | listRow | none | none | Status signal on |
| `discoverLockedWelcoming` | listRow | none | none | Finalized + spots |
| `myGamesRow` | listRow | none | none | Who's going on |
| `homeNextUp` | homeNextUp | none | none | Plain sport icon, no status dot |
| `rallySession` | sessionInline | instant | host | Inline I'm in / lock |
| `detailPickup` | detailHero | request | host | Public pickup detail |
| `detailRally` | detailHero | instant | host | Rally game detail |
| `mapTeaser` | mapTeaser | none | none | Deferred — Map screen |
| `classDiscover` | listRow | request | none | Play → Classes (sport-filtered) | **Deferred** — preset only |

Use `discoverPresetKey()`, `detailPresetForActivity()`, `gameListVariantFromPreset()`, `listRowFlagsFromPreset()` — do not pass ad-hoc `showWhoGoing` / `showStatusSignal` from screens.

## Shell components

| Component | Accepts layouts | Wraps |
|-----------|-----------------|-------|
| `GameCardShell` | `listRow`, `homeNextUp` | `GameListCard` |
| `RallySessionCard` | `sessionInline` | `CrewGameSessionCard` + `createGameCardSessionActions` |
| `GameCardDetailHero` | `detailHero` | Detail hero on `ActivityDetailScreen` |

## Derived counts — single source of truth (T0 · 2026-06-27)

> Added by Tier 0 dogfood triage: a discover card showed **"5 left"** (trailing badge) next to **"9 spots left"** (urgency hook) on the *same* card. Root cause: the badge read server `missing_players` / `player_count`, while the hook computed `capacity − (1 + approvedParticipants)` from a roster summary that is **unreliable on list rows** (participants aren't loaded → falls back to `capacity − 1`).

- [ ] **One source per number.** Any "spots / left / open" figure on a card derives from **one** helper. On list rows that is `getGameListSpotsBadgeLabel` (server `missing_players` → `player_count` fallback). Do **not** also compute spots from `getActivityRosterSummary` on list surfaces — it needs loaded participants the list doesn't have.
- [ ] **No two spot numbers on one card.** The trailing badge is the single spot indicator. The **urgency hook does not restate a spot count** — it carries *time-to-start only* ("Starts in 9h"). If a second spot figure is ever wanted, it must read the **same** helper as the badge and match exactly.
- [ ] **If two surfaces legitimately differ** (e.g. list badge vs detail "X spots open"), the difference must be *explained by state* (list = unconfirmed server count; detail = live roster) and both must be internally consistent — never two contradicting numbers in the same viewport.

### Spots label — state-aware single helper (H1 resolved · 2026-06-27)

> Founder decision (T0 H1): one state-aware label, identical on discover **and** detail (was "5 left" vs "7 spots open" for the same game).

`getActivitySpotsState(activity)` is the **only** producer of the spots label. From server fields (`missing_players`, `player_count`, `roster_max`):

| State | Condition | Label | Tone |
|-------|-----------|-------|------|
| Recruiting | `missing_players > 0` (below roster minimum — not yet viable) | **"{n} more to start"** | recruiting |
| Open | viable, `roster_max − player_count > 0` | **"{n} spots left"** (1 → "1 spot left") | open |
| Full | no open seats | **"Full"** | full |

- [ ] Discover badge (`getGameListSpotsBadgeLabel`) and detail seat bar (`RosterSeatBar`) both call `getActivitySpotsState` — no independent spot strings.
- [ ] Wording is open to copy refinement, but the **two-state transition** ("more to start" → "spots left" at the minimum) is the contract.

## Rules for agents

1. **Add surfaces via presets** — extend `GAME_CARD_PRESETS` and this contract surfaces map; do not add per-screen layout flags.
2. **Join semantics** — `request` → join request; `instant` → roster; `none` → navigate to detail.
3. **Share** — `shareModeForViewer(preset, { isHost })` + `shareGameInvite()`; no inline URLs.
4. **Sport icons** — `sportIconSurface` on preset + `SportIconForSurface`; see [module-sport-icon.md](./module-sport-icon.md).
5. **Session actions** — `gameCardSessionActions` / `createGameCardSessionActions` / `RallySessionCard`; no duplicate handlers in Game Room or panels.
6. **Venue** — court name + `VenueBlock` on detail; `session_note` / `cost_note` are activity fields, not separate layouts.
7. **Subcomponents** — `GameCardParticipantStack`, `RosterSeatBar`, `GameCardTypePill`, `GameCardWhoGoing`, `GameCardSection`.

## Demo setup

1. Linked preview Supabase + Monrovia seed:
   ```bash
   cd RallyApp
   node scripts/seed-monrovia-basketball-rally-demo.mjs
   supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql
   ```
2. **Rally detail + session notes (host):** `marcus@rally-mvrhoops.demo`  
   - Inbox → **Julian Fisher Park Regulars** → Play → upcoming session  
   - Seeded upcoming game has `session_note`: *Full court 5v5. Meet at the south courts.* and `cost_note`: *Free — public courts*
3. **Rally detail (member read-only notes):** `@kunyu` — same session → detail hero shows notes, no edit fields
4. **Pickup detail:** Discover or seed a **public** activity (`regular_group_id` null) — `GameCardTypePill` shows pickup; join = request flow
5. iOS sim, Metro running (`npm start`)

## Required states (phase2 sim scope)

| # | State | Role | How to reach | Must show |
|---|-------|------|--------------|-----------|
| 1 | Detail pickup hero | Non-host | Open public game from Discover → detail | `GameCardTypePill` pickup, `VenueBlock` or court line, request join path |
| 2 | Detail rally hero | Member | Rally hub → tap session → View game | Rally pill, roster/who's going, rally group link if applicable |
| 3 | Host session/cost edit | Host | Detail on upcoming Rally game | Editable session note + cost note; saves on blur |
| 4 | Member notes read-only | Member | Same game as host | Session + cost text visible; no host edit inputs |
| 5 | Session card notes | Host | Rally hub Play tab | Court + session/cost in card meta (`CrewGameSessionCard`) |
| 6 | Lock confirm wiring | Host | Lock roster on session card | Confirm dialog before lock (shared with Game Room) |

## Pass/fail — sim (phase2-game-card)

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Detail pickup — type pill + court/venue | | |
| 2 | Detail rally — type pill + who's going | | |
| 3 | Host can edit session note on detail | | |
| 4 | Host can edit cost note on detail (text only) | | |
| 5 | Member sees session + cost notes read-only | | |
| 6 | Session card shows court + notes on Rally Play | | |
| 7 | Lock roster uses confirm dialog from session card | | |
| 8 | No redbox on above paths | | |

## Pass/fail — audit (grep / unit)

- [ ] **No contradicting counts:** trailing badge and any other count on the same card derive from the **same** helper (`getGameListSpotsBadgeLabel` on list rows); urgency hook carries time-to-start only, no spot count (see "Derived counts — single source of truth")
- [ ] Every wired surface in **Surfaces map** uses listed preset + shell
- [ ] No duplicated join/I'm in/lock/nudge handlers outside `gameCardSessionActions.ts` / `useGameCardSessionActions.ts` / `RallySessionCard`
- [ ] `detailPresetForActivity()` used on detail (not hardcoded pickup/rally flags on screen)
- [ ] `npm test -- gameCardLayouts` passes
- [ ] New preset keys documented in this file before merge

## Screenshots required

Save to `docs/contracts/screenshots/module-game-card/`:

| File | State |
|------|-------|
| `01-detail-pickup-hero.png` | Public game detail — type pill, venue |
| `02-detail-rally-hero.png` | Rally member detail — roster row |
| `03-host-session-cost-edit.png` | Host edit fields on detail |
| `04-member-notes-readonly.png` | Member sees notes, no edit |
| `05-session-card-notes-rally-hub.png` | Play tab session card meta |

## Performance requirements

| ID | Metric | Budget | How to measure |
|----|--------|--------|----------------|
| P1 | Detail hero render | No spinner > 3s after navigation | Tap session → hero visible |
| P2 | Note save on blur | < 2s feedback | Edit session note → blur → persists after refresh |

## Estimated monthly cost

**Δ @ 50 MAU:** $0 — text fields on existing `activities` rows; no new infra.

## Out of scope

- `mapTeaser` wiring on Map screen (preset reserved; refactor later)
- Payment processing (cost note is text only)
- Re-validating Discover / Today list rows (flow-play-screen)
- Re-validating I'm in / lock flow (flow-rally-session)
- Per-location layout variants (only venue **data** differs)

## Related

- [flow-play-screen.md](./flow-play-screen.md) — list presets
- [flow-rally-session.md](./flow-rally-session.md) — session card flow
- [module-sport-icon.md](./module-sport-icon.md) — icon surfaces on presets
- [module-invite-link.md](./module-invite-link.md) — share modes
- [flow-game-room.md](./flow-game-room.md) — action bar wiring

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | `mapTeaser` not wired to MapScreen | — |
| — | phase2-game-card validation pending | — |

## Validator report

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Detail pickup hero | ✅ | Upcoming `Morning pickup run` — venue, time, ready row |
| 2 | Detail rally hero | ✅ | "Game for this Rally" + Open badge |
| 3 | Host session note edit | ✅ | TextField visible with seed note |
| 4 | Host cost note edit | ✅ | Cost note field present |
| 5 | Member notes read-only | N/T | Not re-run as member |
| 6 | Session card notes on hub | ✅ | Covered in `flow-rally-session` |
| 7 | Lock confirm on session card | ✅ | Covered in `flow-rally-session` |
| 8 | No redbox | ✅ | Detail stable on sim |
| A1 | Surfaces map wiring | ✅ | Preset audit deferred to baseline |
| A2 | No duplicate action handlers | N/T | Code audit not re-run |
| A3 | gameCardLayouts tests pass | N/T | Not run this round |

**Last validated:** 2026-06-22 · screenshot `01-upcoming-detail-hero.png`

### Validator report — taste-tier6 · 2026-06-26

> Run: 2026-06-26 · branch `fix/taste-tier6-builder` @ `048f2ef` · code audit  
> Handoff item "detail hero single-column decision" — no tier-6 checklist row in contract; baseline hero unchanged.

| # | Item | Result | Notes |
|---|------|--------|-------|
| H1 | Detail hero layout (handoff) | **Deferred** | No tier-6 checklist row; hero structure unchanged this cycle |
| H2 | Join banner below hero | **Pass** | Banner + roster sit directly under `GameCardDetailHero` |

**Verdict:** PASS (no tier-6 contract rows; handoff H1 deferred).
