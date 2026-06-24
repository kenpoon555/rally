# Product review — badminton-casual · tier 3 · 2026-06-22

## Persona

**Sport:** Badminton · **Level:** L2 casual  
**Goal:** Sunday social — open Play and **my sport is already there**, find players in under 2 minutes.  
**Contracts:** [flow-play-screen.md](../../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round3-ux` tier 3 · **Prior:** [2026-06-22-review.md](./2026-06-22-review.md) (tier 1 pickup)

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim |
| Account | `@kunyu` |
| Path | Play → Badminton → Games / Players |

## User-perspective journey

| Step | Casual expectation | Actual | Feel |
|------|-------------------|--------|------|
| Open Play as badminton player | Badminton first or second on strip | Pickleball + Basketball occupy slots 1–2 | *"This isn't my app"* |
| Pick Badminton (strip or More) | Strip becomes **my** row | Badminton in slot 3 only; PB/BB stay | Tolerable if Badminton on default strip |
| Browse another sport, return to Badminton | Badminton still one tap on strip | After off-strip picks, Badminton **falls off strip** → More again | **Fail** for casual |
| Players → find `@kunyu` row | Quick scan | Row present; **10d ago** vs *"next few hours"* subtitle | Trust break (carry P1 from tier 1) |

## What worked

- Badminton on **default** strip (slot 3 in LA order) — one tap when session starts clean.
- Games empty copy: *"No Badminton games nearby"* — honest.
- Players filter: `@kunyu · Badminton` only when Badminton selected.
- Meetup/court empty steps appropriate for badminton.

## Friction (prioritized)

| P | Screen | Issue | User impact | Suggested change | Backlog |
|---|--------|-------|-------------|------------------|---------|
| **P0** | Play strip | Casual badminton player sees **Pickleball + Basketball** before Badminton | Beta copy says *"focused on LA badminton"* but UI says pickleball-first | Promote `preferred_sports` / attended sports to strip front | B16 |
| **P1** | Play strip | After trying Running/Soccer, **Badminton requires More** again | Casual won't hunt — bounces | MRU keeps Badminton visible after first pick | B17, B18 |
| **P1** | Play → Players | *"next few hours"* vs **10d ago** on `@kunyu` | Breaks L2 trust | Recency filter or honest subtitle | B14 |
| **P2** | Play → Players | Free-agent row not tappable for non-host | Dead-end for casual browse | Tap → profile / DM | tier 1 carry |
| **P2** | Play → Games | Zero open badminton games in demo | Content gap | Seed 1 discoverable game | demo |

## Profile vs Play mismatch

`@kunyu` player card shows **Pickleball · Basketball · Badminton** as sports played — Play strip ignores this and always leads with catalog defaults until slot 3.

## Screenshots

| File | Capture |
|------|---------|
| `2026-06-22/01-tier3-badminton-slot3-global-strip.png` | Badminton selected; PB/BB slots 1–2 |
| `2026-06-22/05-tier3-badminton-players-kunyu.png` | Soccer session end-state (strip eviction example) |

## Verdict

**Tier 3 UX personalization: FAIL** — content/filter OK; strip does not treat badminton as *my* sport after multi-sport browse.
