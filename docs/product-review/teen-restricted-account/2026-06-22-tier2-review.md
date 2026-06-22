# Product review — teen-restricted-account · 2026-06-22 (tier 2 · play-discover)

## Persona

**Role:** R5 teen (13–17) · **Goal:** Play tab shows pickup surfaces only — no Classes segment, no coach/parent noise while browsing Discover.  
**Contracts:** [module-role-surfaces.md](../../contracts/module-role-surfaces.md) · [flow-play-screen.md](../../contracts/flow-play-screen.md)  
**Queue:** `play-discover-round2-picky` tier 2 · persona 3/4

## Setup

| Item | Value |
|------|-------|
| Device | iPhone 16 sim (`06244EDD-C6DC-4A80-92A2-ADC1D73B9382`) |
| Account | `@teenr5676` (`teen.r5.1782085676@rally-mvrhoops.demo`) — H2 probe `is_coach=true` |
| Flags | CPS flags on |
| Cross-ref | Onboarding tier 2: [2026-06-22-review.md](./2026-06-22-review.md) |

## Primary checks (Play / Discover)

| Check | Result | Notes |
|-------|--------|-------|
| Play segment gate — no Classes | **Pass** | Games \| Players only on Play |
| Play → Create game — pickup only | **Pass** | No Class/Clinic entry |
| Sport filter — teen browse | **Pass** | Basketball / Badminton scoped like R0; no coach class cards on Play |
| Profile — no Family / Coach Tools | **Pass** | H2 probe — see onboarding review |
| Silent failure on Play path | **Pass** | Empty states render; no blank screen |

## Friction (prioritized)

| P | Screen | Issue | Suggested change | Contract impact |
|---|--------|-------|------------------|-----------------|
| P3 | Play → Players empty | Lowercase *running* in Players empty vs capitalized Games meetup title | Capitalize sport name in Players empty | `flow-play-screen` copy parity |
| P0 | Fresh signup (carry) | Legal consent gate blocks fresh teen E2E — not Play-specific | Fix upstream consent network | `flow-parent-guardian-consent` |

## Recommended contract changes

- [ ] None blocking play-discover tier 2 — teen Play surface gates hold.
- [ ] Cross-ref onboarding tier 2 for H2 / Add Child / legal P0.

## Verdict

**Tier 2 pass (play-discover scope)** — teen sees Games \| Players only on Play; no Classes leak with CPS flags on.
