# Flow — Play / Discover screen

**Contract id:** `flow-play-screen`  
**Status:** Draft — sprint prep  
**Screens:** `HomeScreen` (Discover), `DynamicHomeScreen` (Today), map teaser cards  
**Related code:** `src/pages/Home/HomeScreen.tsx`, `src/utils/buildPlayStripSports.ts`, `src/components/game/GameCardShell.tsx`, `src/config/gameCardLayouts.ts`, `src/config/surfaceVisibility.ts`  
**Surface matrix:** [module-role-surfaces.md](./module-role-surfaces.md)

## Purpose

Players browse open games on Discover and Today with consistent game cards, correct status signals, and navigation to detail.

North-star: **Open Discover → see open games with preset-driven cards → tap → Activity detail.**

## Demo setup

1. Seeds with active activities (`missing_players > 0`).
2. Tester location enabled for distance sort (optional).
3. Accounts: host + non-member tester.

### Sport selection (required behavior)

| Rule | Spec |
|------|------|
| **Default filter** | `user.preferred_sports[0]` when set and launch-enabled; else `getDefaultLaunchSportName()` (Pickleball). |
| **MRU on pick** | Tapping any sport (strip or More sheet) updates `selectedSport` **and** persists `preferred_sports` as MRU array (max 5): `[picked, …prior]` deduped. |
| **Re-open Play** | Must restore last selected sport **and** strip chip order from MRU + attendance — not silently reset to global catalog head. |
| **Strip source** | `buildPlayStripSports`: **selected** → `preferred_sports` MRU → `orderSportsAttended` → catalog fallback (`sortSportsForPlayTab`). Not fixed `PLAY_TAB_SPORT_ORDER` head for returning users. |
| **On More pick** | Promote sport to front of strip; prior MRU sports remain visible (up to max visible). |
| **Visible count** | Up to **5** sport chips on strip (horizontal scroll); **More** only when launch catalog exceeds visible chips. |
| **Shared helper** | Same strip builder for `HomeScreen` and `CreateActivityScreen`. |
| **B7 minimum (superseded)** | Tier 2 allowed slot-3 swap only — tier 3 requires full MRU strip above. |

**Fail** if empty state / list is scoped to e.g. Racquetball but strip shows only Pickleball / Basketball / Badminton with only **More** highlighted.

**Fail (tier 3 UX)** if user with `preferred_sports: [Badminton]` and Badminton attendance still sees Pickleball + Basketball in slots 1–2 unless they have actually played those sports.

**Fail (tier 3 UX)** if 3+ sports picked from More in one session do not all remain visible on strip (max 5) without reopening More.

**Product review:** [play-discover-ux synthesis](../product-review/consolidated/2026-06-22-play-discover-ux-synthesis.md) · H1=A (5 catalog sports for new users) · H2=A (defer More-sheet Recent).

## Required states

| State | Surface | Must show |
|-------|---------|-----------|
| **Discover open** | Play → Games | `discoverOpen` preset — status signal on |
| **Discover locked welcoming** | Play → Games | `discoverLockedWelcoming` variant |
| **Players nearby** | Play → Players | Free-agent rows + section header (see screenshot) |
| **Classes (v1.1+)** | Play → Classes | Adult coach-led listings — **same sport filter as Games** — [module-coach-parent-navigation.md](./module-coach-parent-navigation.md) |
| **Today Next Up** | DynamicHome | `homeNextUp` — plain sport icon via `todayGameList`, no status dot |
| **Empty Discover** | Play → Games | Empty state — no crash |
| **Today empty (new host)** | User with zero Rallies / no Next Up | CTA: Create a Rally + Find a game — no dead screen |
| **Sport filter** | Deep link or param | Filtered list updates (Games; Classes when shipped) |

## Sport strip × segment matrix (required)

Full role rules: [module-role-surfaces.md](./module-role-surfaces.md). Validator must spot-check **at least 3 sports** (Basketball, Running, Badminton).

| Strip sport | Games | Players | Classes (if segment visible) |
|-------------|-------|---------|------------------------------|
| Basketball | Basketball activities only | Basketball rows or sport-specific empty | Basketball classes |
| Running | Running only | **Must not show Badminton/Pickleball** | Running classes |
| Badminton | Badminton only | Badminton free agents OK | Badminton classes |

**Fail** if Players segment shows rows for a sport other than the strip selection.

## Pass/fail checklist

- [ ] All list rows use `GameCardShell` + preset (no ad-hoc layout flags)
- [ ] Open vs locked_welcoming variants match activity state
- [ ] Tap navigates to `ActivityDetail` with correct id
- [ ] Pull-to-refresh reloads without duplicate rows
- [ ] Map teaser — **deferred** until `MapScreen` wires `mapTeaser` preset (see [module-game-card.md](./module-game-card.md))
- [ ] **Today empty:** new user / no Rallies sees Create Rally + Discover CTAs (no blank screen)
- [ ] Play → **Players** segment loads free-agent list (regression when Classes added)
- [ ] When Classes ships: selected sport filter applies to Classes same as Games (see navigation contract)
- [ ] **Sport × Players:** Running strip → no Badminton/Pickleball rows ([module-role-surfaces.md](./module-role-surfaces.md))
- [ ] **Sport × Players:** strip change refreshes list without cross-sport leak
- [ ] **Classes segment:** hidden for R0 when flag on but no class context
- [ ] **Games empty (Running):** title uses sport name — not ambiguous *"running"* (active vs Running sport)
- [ ] **Players section:** subtitle matches data — no *"next few hours"* with multi-day-old posts (or filter recency)
- [ ] **First-timer empty Discover:** secondary hint for invite link / paste (L1)
- [ ] **Off-strip sport in strip:** More → Racquetball / Running / etc. — active sport appears in quick row slot 3 (icon + label selected)
- [ ] **Sport persistence:** re-open Play tab — last selected sport still active (profile `preferred_sports`)
- [ ] **Personalized strip:** 3+ sports picked from More in one session — all remain visible on strip (max 5) without reopening More
- [ ] **MRU persistence:** kill app → Play strip order matches last session MRU (`preferred_sports` array)
- [ ] **Attended sports:** `@kunyu`-style account — strip reflects played sports, not forced global PB/BB head when attendance differs
- [ ] **Empty-state hero icon:** glyph centered; no misaligned square tile behind icon ([module-sport-icon.md](./module-sport-icon.md) `discoverEmptyState`)

## Play → Classes (deferred — separate contract)

Third segment **Games | Players | Classes** is specified in [module-coach-parent-navigation.md](./module-coach-parent-navigation.md). Hidden behind feature flag until v1.1. **Not part of GTM 1 baseline validation.**

## Screenshots required

`docs/contracts/screenshots/flow-play-screen/` — discover open, locked welcoming, **players nearby**, today next up, today empty host, discover empty.

| File | Capture |
|------|---------|
| `off-strip-sport-in-strip.png` | More → off-strip sport (e.g. Racquetball) — slot 3 shows sport icon + label selected; empty title matches |
| `discover-empty-icon-aligned.png` | Games empty — hero sport icon centered (plain or 56px circle; no offset square block) |
| `personalized-strip-after-mru.png` | After 3+ More picks — MRU sports visible on strip (e.g. Soccer first for `@kunyu`); up to 5 chips |

## Out of scope

- Host create flow (`flow-create-game`)
- Need-players posts
- Play → Classes segment (see `module-coach-parent-navigation`)
- Parent Family UI (see `module-student-profile`)

## Validator report

> Run: 2026-06-22 ~13:05 PT · iOS Simulator · branch `fix/play-discover-builder`

| # | Checklist item | Pass | Notes |
|---|----------------|------|-------|
| 1 | Discover empty state | ✅ Pass | Running meetups title + invite hint on Games empty. |
| 2 | Sport filter updates list | ✅ Pass | Basketball / Running / Badminton scoped. |
| 3 | Players nearby segment | ✅ Pass | Section header + updated subtitle (no "next few hours"). |
| 4 | Discover open / locked cards | N/T | No open activities in DB. |
| 5 | Tap → ActivityDetail | N/T | Not re-run. |
| 6 | Today quiet / rally CTA | N/T | Covered in prior baseline. |
| 7 | GameCardShell presets | N/T | No open-game rows. |
| 8 | No redbox | ✅ Pass | Play stable. |
| 9 | Sport × Players Running | ✅ Pass | No cross-sport leak. |
| 10 | Strip change refresh | ✅ Pass | |
| 11 | Classes hidden R0 | N/T | See `module-role-surfaces` — no R0 login. |
| 12 | Games empty Running title | ✅ Pass | *"No Running meetups nearby"*. |
| 13 | Players subtitle vs data | ✅ Pass | Subtitle honest; stale row acceptable per H1 option B. |
| 14 | First-timer invite hint | ✅ Pass | Copy on Games empty state. |
| 15 | Off-strip sport in strip | ✅ Pass | Racquetball in slot 3 (`off-strip-sport-in-strip.png`); preferred_sports restored on launch. |
| 16 | Sport persistence | ✅ Pass | R0 `@playerr0pd1782160073` re-opened with Racquetball active. |
| 17 | Empty-state hero icon | ✅ Pass | Plain glyph in 56px circle — no square tile (`discover-empty-icon-aligned.png`). |

### Screenshots

- Reuse `docs/contracts/screenshots/module-role-surfaces/` for matrix captures.
- `flow-play-screen/off-strip-sport-in-strip.png`, `discover-empty-icon-aligned.png`

## Product review — tier 2 picky (2026-06-22)

**Queue:** `play-discover-round2-picky` · 4/4 personas · tag `play-discover-picky`

| Theme | Verdict |
|-------|---------|
| B7 off-strip slot 3 | **Pass** — matrix auditor + minimalist |
| B11 empty hero icon | **Pass** |
| R0 Games \| Players only | **Pass** — `@playerr0pd1782160073` |
| Sport × segment matrix | **Pass** — no cross-sport leak |
| Invite north-star | **Carry P0** — `flow-invite-to-rally` (not Play regression) |

**Optional follow-ups (P2/P3):** Players empty capitalize sport name; invite hint prominence; free-agent recency.


## Product review — tier 3 UX personalization (2026-06-22)

**Queue:** `play-discover-round3-ux` · 4/4 personas · tag `play-discover-ux`

| Theme | Pre-builder verdict | Contract |
|-------|---------------------|----------|
| Strip feels like "my sports" | **Fail** | B16 — MRU + attendance strip |
| More → pick promotes + retains | **Fail** | B17 — up to 5 visible chips |
| MRU persistence | **Fail** | B18 — `preferred_sports` array |
| Segment matrix regression | **Pass** | tier 2 carry |

**Builder:** `fix/play-discover-ux-strip` · validation queue `play-discover-matrix`.

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| 2026-06-22 | Running filter leak — **resolved** on builder branch | — |
