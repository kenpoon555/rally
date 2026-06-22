# Product review — play-discover-minimalist · tier 2 · 2026-06-22

## Persona

**Sport:** Basketball (default strip) · **Role:** R0 player only · **Level:** L2 casual  
**Goal:** Only see Games + Players on Play — no Classes tab, no coach/parent noise on Profile.  
**Contracts:** [module-role-surfaces.md](../../contracts/module-role-surfaces.md) · [flow-play-screen.md](../../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round2-picky` tier 2 · **Prior:** [2026-06-22-review.md](./2026-06-22-review.md) (round 1 — blocked on R0 login)

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim (`06244EDD-C6DC-4A80-92A2-ADC1D73B9382`) |
| Account | `player.r0.playdiscover.1782160073@rally-mvrhoops.demo` / `MonroviaHoops26!` (`@playerr0pd1782160073`) |
| Auth | `simctl openurl` → `rallyapp://auth/callback#access_token=…` |
| Build | Local dev · CPS flags on · post–tier 2 UX (`fix/play-discover-tier2-ux` — B7/B11) |

## What worked

- **R0 segment gate:** Play shows **Games \| Players** only — no Classes pill (accessibility + visual proof on R0).
- **Profile gate:** `@playerr0pd1782160073` — no Coach Tools, no Family; Me / Connect / Settings only.
- **B7 off-strip sport:** More → Running — **slot 3** shows Running icon + label selected (not More-only highlight).
- **B11 empty hero:** Running Games empty — runner glyph in 56px circle; no offset square tile.
- **Running Games copy:** *"No Running meetups nearby"* — capitalized sport name (round 1 P1 resolved).
- **Sport × Players filter:** Running → empty sport copy, no cross-sport rows; Badminton → `@kunyu · Badminton` only.
- **Cognitive load:** Two-segment Play surface + four-icon strip reads clean for casual pickup player post-B7.

## Primary checks

| Check | Result | Notes |
|-------|--------|-------|
| R0 — no Classes segment | **Pass** | Games \| Players only; no Classes in AX tree |
| R0 Profile — no Coach Tools / Family | **Pass** | Me tab; `@playerr0pd1782160073` |
| Basketball strip → Games | **Pass** | Open game card (*Morning pickup run*) |
| Basketball strip → Players | **Pass** | *"No basketball players posting yet"* |
| Running (off-strip) → slot 3 visible | **Pass** | B7 — Running in quick row slot 3 |
| Running → Games empty title | **Pass** | *"No Running meetups nearby"* + centered icon |
| Running → Players empty | **Pass** | No Badminton/Pickleball leak |
| Badminton → Players rows | **Pass** | Single `@kunyu · Badminton` row |
| Sport strip coherence (B7/B11) | **Pass** | Off-strip surfaces in slot 3; empty icon aligned |
| Cognitive load acceptable | **Pass** | 2 segments, clear strip; no coach/class noise |

## Friction (prioritized)

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P3 | Play → Players | *"No **running** players posting yet"* — lowercase vs Games *"Running meetups"* | Capitalize sport name in Players empty title for parity | `flow-play-screen` empty copy |
| P3 | Play → Players | `@kunyu · Badminton · **10d ago`** feels stale on a casual browse | Hide posts older than N days or soften timestamp | Optional — `flow-play-screen` |
| P3 | Play → Games | One open card titled *"Morning pickup run"* under Basketball — copy OK but distance ~16 mi may feel far for "nearby" | Distance sort / copy threshold — out of minimalist scope | — |

## Sport-specific

- Monrovia seed: Basketball has one open game; Badminton has one free-agent row; Running empty on both segments — all sport-scoped.
- Off-strip Running: strip + empty states stay coherent after B7.

## Screenshots

| File | Notes |
|------|-------|
| `2026-06-22/01-play-games-r0.png` | R0 Basketball Games — Games \| Players only |
| `2026-06-22/04-running-offstrip-slot3-v2.png` | B7 — Running in slot 3, Players segment |
| `2026-06-22/05-running-games-empty-b11-v2.png` | B11 — Running meetups empty + centered icon |
| `2026-06-22/07-profile-r0-v3.png` | R0 Profile — no coach/parent blocks |
| `2026-06-22/08-badminton-players-r0.png` | Badminton Players — `@kunyu` row only |

## Recommended contract changes

- [ ] None blocking — round 1 R0 Classes proof gap **closed** on `@playerr0pd1782160073`.
- [ ] Optional: `flow-play-screen` — Players empty title capitalize `{sport}` like Games (*"No Running players posting yet"*).

## Verdict

**Tier 2 pass** for `play-discover-minimalist`. R0 role gates and B7/B11 UX fixes hold on fresh R0 demo account. Residual friction is P3 copy/staleness only.
