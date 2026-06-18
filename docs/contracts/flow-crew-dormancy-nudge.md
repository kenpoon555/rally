# Flow — Crew dormancy nudge (ops)

**Contract id:** `flow-crew-dormancy-nudge`  
**Status:** Implemented  
**Phase:** Ops / retention  
**Trigger:** No scheduled game in Rally for N days (default **14**)  
**Related code:** `065_crew_dormancy_nudge.sql`, `send-push` (`crew_dormancy_nudge`), `process-crew-dormancy-nudges`, `crewDormancyNudgeService.ts`, `navigationRef.ts`

## Purpose

Re-activate idle Regulars groups with a single actionable push — not a marketing blast.

North-star: **Rally inactive 14d → captain gets push → tap opens Rally Play tab → schedule/create CTA visible.**

## Product rules (required when built)

| Rule | Value |
|------|-------|
| **Audience** | Rally **host/captain** only (not every member) |
| **Cooldown** | Max 1 dormancy push per Rally per 14 days |
| **Deep link** | Opens Rally hub Play tab for that `group_id` |
| **Copy** | Action-oriented ("Schedule your next game") — no guilt/shame |

## Pass/fail checklist (when implemented)

- [x] Trigger fires only when last completed/scheduled game > N days ago
- [x] Active Rally with upcoming game does **not** get nudge
- [x] Tap notification routes to correct Rally
- [x] Opt-out respects quiet hours / notification prefs if present
- [x] `crew_dormancy_nudge_sent` event logged (add to `module-analytics-events.md`)
- [x] Manual test hook in dev (`__DEV__` or admin) for Validator

## Screenshots required

`docs/contracts/screenshots/flow-crew-dormancy-nudge/` — push notification, landing on Play tab.

## Out of scope

- Email/SMS campaigns
- Dormancy nudge to all members (spam)

## Open issues

| Date | Blocker | Owner |
|------|---------|-------|
| — | — | — |
