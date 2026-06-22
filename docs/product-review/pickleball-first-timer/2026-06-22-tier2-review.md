# Product review — pickleball-first-timer · 2026-06-22 (tier 2 picky)

## Persona

**Sport:** Pickleball · **Level:** L1 first-timer  
**Goal:** Retiree group invite → simple accept path; if browsing first, understand Play without jargon.  
**Contracts:** [flow-play-screen.md](../../contracts/flow-play-screen.md) · [module-role-surfaces.md](../../contracts/module-role-surfaces.md)  
**Queue:** `play-discover-round2-picky` · tier 2 · persona 4/4

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim (`06244EDD-C6DC-4A80-92A2-ADC1D73B9382`) |
| App | Native dev client `com.rallyapp` |
| Accounts | Fresh R0 `@playerr0pd1782160073` (empty discover) · `marcus@rally-mvrhoops.demo` (seeded pickleball + coach surfaces) |
| Prior round | Tier 1 flagged missing invite hint on empty Discover — **B5 shipped** in play-discover round 1 |

---

## Journey summary

| Step | Contract expectation | Observed | Result |
|------|---------------------|----------|--------|
| Open Play → Pickleball default | Strip slot 1; sport-scoped list | Pickleball icon + green label; one open LA game on Marcus seed | **Pass** |
| Empty Discover (no games) | Sport title, no crash, L1 invite hint | R0 Racquetball empty: *"No Racquetball games nearby"* + numbered host/invite steps + footer invite hint | **Pass** |
| Invite hint on empty | Secondary copy for friend link / paste | *"Got an invite from a friend? Open their Rally or game link from Messages or email."* visible below Host CTA | **Pass** (B5) |
| Sport strip clarity (L1) | Obvious selection; off-strip sport surfaced | Pickleball/Basketball/Badminton icons + labels; Racquetball appears in **slot 3** when selected via prior session (B7) | **Pass** |
| R0 segment clutter | Games \| Players only | Fresh R0 — **no Classes** pill | **Pass** |
| Pickleball → Players | Board sport rows or sport empty | Two Pickleball free-agent rows only; `@kunyu` copy *"New to pickleball — looking for patient partners"* | **Pass** |
| Friend SMS invite → accept | Land on game/Rally without account jargon | Not re-run — tier 1 **P0** deep-link silent no-op still blocks persona north-star | **Blocked** (carry `flow-invite-to-rally`) |
| Coach account noise | N/A for R0 first-timer | Marcus: Games \| Players \| **Classes** + *NEXT CLASS · Alex · Youth Basketball* banner while Pickleball selected | **Partial** (role leak if L1 lands on coach demo login) |

---

## What worked

- **Empty Discover is first-timer friendly post round 1:** Sport-specific title, LA beta line names pickleball, numbered 1–2 steps, full-width Host CTA, and the **invite hint** footer the tier 1 review asked for.
- **Empty-state hero icon** is a centered glyph in a 56px ring — no misaligned square tile (B11).
- **Sport strip** uses icon + label; active sport turns green — readable for an L1 retiree without knowing "filters."
- **Off-strip persistence (B7):** R0 reopened Play with Racquetball in quick-row slot 3 instead of only a highlighted More ring — list title still Racquetball-scoped.
- **Pickleball Players** respects sport filter; beginner-friendly peer copy on `@kunyu` row.
- **Monrovia seed:** When games exist, one pickleball open game card is tappable-looking (*8 spots left*, time, location) — organic browse path works when content exists.

## Friction (prioritized)

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P0 | Invite path (carry tier 1) | SMS/group invite still does not complete accept before login — persona north-star blocked | Fix shared deep-link handoff | `flow-invite-to-rally` (upstream of Play) |
| P2 | Play → Games empty | Host-first funnel dominates; invite hint is **caption below** Host button — retiree with a link may tap Host before reading | Promote invite hint to step 0 or equal-weight secondary button *"Open invite link"* | `flow-play-screen` first-timer empty |
| P2 | Play (Marcus) | **Classes** segment + cross-sport *NEXT CLASS* banner while Pickleball selected — L1 asks *"Is my game under Games or Classes?"* | Hide Classes for non-class context; banner should match strip sport or hide for player-only | `module-role-surfaces` |
| P2 | Play → More | More sheet once rendered **black screen** after tap (sim); recovered on relaunch | Investigate sheet mount on native client | None if not reproducible |
| P3 | Empty copy | *"Rally"* in step 2 without one-line definition | *"Your group's chat + schedule"* once on empty state | Copy only |
| P3 | Play → Players | Free-agent rows **11–12d old** — fine for hosts, stale for *"who can I play today?"* | Recency filter or softer section subtitle | `flow-play-screen` (optional) |

**Tier 2 silent-failure check:** No crashes or redbox on Play tab during matrix walk. Sport strip changes update list scope without cross-sport rows.

## Sport-specific

- Pickleball is called out in LA beta body copy on empty state — reassuring for a retiree group told *"Rally does pickleball."*
- Board-sport Players empty would show *"No players nearby yet"* + Profile post hint per contract; not exercised this pass (rows present on seed).
- When pickleball games exist, empty-state invite hint is **not shown** — acceptable; join path is the open card.

## Contract checklist (tier 2)

| Item | Pass | Notes |
|------|------|-------|
| First-timer empty Discover — no crash | **Pass** | R0 Racquetball empty card |
| First-timer invite hint (L1) | **Pass** | Footer on Games empty (B5) |
| Empty title uses sport name | **Pass** | *"No Racquetball games nearby"* |
| Empty-state hero icon aligned | **Pass** | Centered ring glyph (B11) |
| Off-strip sport in strip slot 3 | **Pass** | Racquetball in slot 3 on R0 |
| Sport persistence on re-open | **Pass** | R0 retained Racquetball from prior selection |
| Pickleball strip → Games scoped | **Pass** | Open pickleball card only |
| Pickleball strip → Players scoped | **Pass** | Pickleball free agents only |
| R0 no Classes segment | **Pass** | `@playerr0pd1782160073` |
| Sport strip clarity for L1 | **Pass** | Icon + label + green active state |
| Deep link invite accept | **Blocked** | Tier 1 P0 — out of tier 2 contract scope but blocks persona |

## Screenshots

| File | State |
|------|-------|
| `2026-06-22/01-pickleball-games-open.png` | Marcus — Pickleball strip, one open game |
| `../../contracts/screenshots/flow-play-screen/off-strip-sport-in-strip.png` | R0 — Racquetball slot 3 + empty title |
| `../../contracts/screenshots/flow-play-screen/discover-empty-icon-aligned.png` | Empty Games — hero icon |
| `../../contracts/screenshots/module-role-surfaces/02-r0-no-classes-segment.png` | R0 — Games \| Players only |

## Recommended contract changes

- [ ] `flow-play-screen`: Mark first-timer invite hint + empty icon rows **green** for tier 2 picky — no regression vs round 1 builder.
- [ ] `flow-play-screen`: Consider elevating invite-hint affordance for L1 empty state (P2) — optional copy/layout, not a ship blocker.
- [ ] `module-role-surfaces`: Note that coach demo login (Marcus) is **not** a first-timer proof account — use fresh R0 for R0 segment checks.
- [ ] Cross-ref `flow-invite-to-rally` P0 — pickleball retiree persona remains blocked on invite north-star until deep links land.

## Verdict

**Play Discover tier 2 contract focus: Pass with carry-forward P0 on invite path.** Empty Discover, invite hint, and sport-strip clarity meet `flow-play-screen` / `module-role-surfaces` expectations for an L1 pickleball user on R0. Persona north-star (group SMS → accept) still blocked by upstream invite deep link — not a tier 2 Play regression.
