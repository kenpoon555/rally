# Phase validation backlog — status

**Updated:** 2026-06-22  
**Re-seed:** `./scripts/seed-monrovia-linked.sh`  
**Queues:** [validation-queues.json](./validation-queues.json)

## Did we already run these?

**Yes** — `baseline` (#55), `gtm2` (#53), `cps-onboarding`, `sport-meetup` — **not** the same as `phase1a`–`ops`. See overlap table in prior rounds.

## Completed on `dev` (2026-06-22 phase pass)

| Queue | Status | Notes |
|-------|--------|-------|
| `cps-onboarding` | ✅ | #47–#48 |
| `gtm2-feedback-jun-2026` | ✅ | #53 |
| `sport-meetup-launch` | ✅ | #54 |
| `baseline` | ✅ | #55 |
| `phase1a` | ✅ | Attendance + nudges + analytics scorecard |
| `phase1b` | ✅ | Vote + close via RPC; poll card scroll fix in app |
| `phase1c` | ⚠️ | Rotation RPC ✅; leaderboard RPC ✅; mini-tourney create ✅; UI/device N/T |
| `phase2-recap` | ⚠️ | Recap card ✅; `recap_viewed` event ❌ |
| `phase2-game-card` | ✅ | Upcoming detail hero screenshot |
| `ops` | ✅ | Dormancy claim RPC + dev hook; push device N/T |

## Builder backlog

_None — GTM 2 scorecard events wired 2026-06-22._

## Device / human only

| Item | Why |
|------|-----|
| `flow-push-notifications-device` | Physical device + push |
| `gtm1-launch-gate` | HTTPS universal links |
| Mini-tournament gameplay | Second account |
| Poll create sheet | Optional re-proof after Metro reload |

## Code changes this pass (need Metro reload)

- `AvailabilityPollCard` — testIDs + accessibility
- `RallyChatPanel` — scroll to poll header on load
- `deepLinking.ts` — `rallyapp://crew/:groupId/:initialTab?` (e.g. `/members`)

## SERVICE_ROLE_KEY vs Supabase CLI

| Path | Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env`? |
|------|---------------------------------------------|
| `supabase db query --linked` | **No** |
| `node scripts/seed-monrovia-….mjs` | **Yes** — or `./scripts/seed-monrovia-linked.sh` |
