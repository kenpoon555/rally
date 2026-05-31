# Phase 2: `fastFixed` matching profile (plan)

Last updated: 2026-04-11

## Purpose

Add a **second** matching profile for **higher-liquidity** sports where users expect an **exact published time and place** and quick joins—without running the preference-collection flow first.

## Profile: `fastFixed`

- Maps to `scheduling_mode: 'fixed'` and `match_status: 'open'` at create time.
- Host picks **one** location and **one** start time; others request to join.
- Best for: Basketball, Running, and similar high-frequency / court-or-route sports once you enable them in config.

## Config-based migration (no schema rewrite)

- Each sport in [`src/constants/sports.ts`](../src/constants/sports.ts) has `matchingProfile` and `launchEnabled`.
- To move a sport from `partnerFlex` to `fastFixed` (or the reverse):
  1. Update `SPORT_METADATA[sport].matchingProfile` and `defaultSchedulingMode`.
  2. Set `launchEnabled: true` when that sport is part of the active release wedge.
  3. Adjust copy in Create / Discover if needed (sport-driven labels).

## Rollout suggestion

1. Finish Phase 1 device QA for Tennis + Badminton (`partnerFlex`).
2. Enable **one** `fastFixed` sport (e.g. Basketball) in a minor release.
3. Measure join latency and host friction vs flex flows.

## Acceptance (engineering)

- Create Activity defaults `scheduling_mode` from `defaultSchedulingMode` per sport.
- Discover filters only show `launchEnabled` sports for new sessions; legacy activities still render.
