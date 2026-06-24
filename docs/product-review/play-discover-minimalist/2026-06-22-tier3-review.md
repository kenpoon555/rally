# Product review — play-discover-minimalist · tier 3 · 2026-06-22

## Persona

**Sport:** Basketball (default strip) · **Role:** R0 player · **Level:** L2 casual  
**Goal:** Minimal chrome — only what I need; strip should not shout sports I don't play.  
**Contracts:** [module-role-surfaces.md](../../contracts/module-role-surfaces.md) · [flow-play-screen.md](../../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round3-ux` tier 3 · **Prior:** [2026-06-22-tier2-review.md](./2026-06-22-tier2-review.md) (R0 segment gate)

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim |
| Account | `@kunyu` (R0-style — no Coach Tools / Family on Profile this session) |
| Focus | Strip cognitive load + personalization vs tier 2 segment gate |

## What still works (tier 2 carry)

- **Games \| Players** only on Play — no Classes noise (re-confirmed on `@kunyu`).
- Profile: Me / scorecard — no Coach Tools block in scroll viewport.
- Empty states visually clean post-B11.

## New friction — strip is not minimal

| P | Screen | Issue | Minimalist read | Suggested change | Backlog |
|---|--------|-------|-----------------|------------------|---------|
| **P0** | Play strip | **Four** chrome items (3 sports + More) but only **one** reflects last intent after More picks | Visual noise without utility | Grow to 4–5 **useful** chips or collapse to 2+More | B17 |
| **P0** | Play strip | Slots 1–2 are **always** Pickleball + Basketball — even when user never selected them this session | Clutter — two icons I didn't ask for | Hide unplayed defaults; show MRU only | B16 |
| **P1** | Play strip | More sheet is **12 icons** with no recents — heavy for minimalist | One tap became twelve | Recent row (max 4) above grid | B19 |
| **P2** | Empty footer | *"Try another sport using the filters above"* + LA beta copy | OK for first visit; repetitive for return user | Soften after `preferred_sports` set | copy |
| **P3** | Segment toggle | Games \| Players not in AX tree | Automation gap | testIDs on `SegmentToggle` | a11y |

## Cognitive load test

| Surface | Tier 2 | Tier 3 issue |
|---------|--------|--------------|
| Segments | 2 pills ✅ | unchanged |
| Strip icons | 4 (3+More) — felt OK when defaults match | **Fails** when 2/3 icons are irrelevant sports |
| Empty card | Centered icon ✅ | unchanged |

**Minimalist verdict on strip:** Tier 2 passed because R0 segment gate was the bar. Tier 3: strip is **busier than necessary** for a player who only cares about 1–2 sports.

## Profile evidence

`@kunyu` card: Pickleball, Basketball, Badminton — Play strip should show **only** those three (+ More if needed), not catalog head + swap slot.

## Screenshots

| File | Capture |
|------|---------|
| `2026-06-22/01-tier3-strip-clutter.png` | Profile — sports played vs strip mismatch |
| tier 2 folder | R0 segment proofs still valid |

## Verdict

**Segment gate: PASS (regression)** · **Strip personalization: FAIL** — minimalist needs fewer, more relevant chips (B16–B17).
