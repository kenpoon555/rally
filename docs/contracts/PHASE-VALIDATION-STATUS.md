# Phase validation backlog — status

**Updated:** 2026-06-22  
**Re-seed:** `./scripts/seed-monrovia-linked.sh` (CLI fetches `service_role` — no `.env` paste needed)  
**Queues:** [validation-queues.json](./validation-queues.json)

## Completed on `dev`

| Queue | Status | PR / note |
|-------|--------|-----------|
| `cps-onboarding` | ✅ | Onboarding rounds #47–#48 |
| `gtm2-feedback-jun-2026` | ✅ | #53 |
| `sport-meetup-launch` | ✅ | #54 |
| `baseline` | ✅ | #55 |
| `flow-rally-session` (re-proof) | ✅ | After re-seed — I'm-in/lock rows green 2026-06-22 |

## Sim-ready — next to run

| Queue | Contracts | Notes |
|-------|-----------|-------|
| `phase1a` | post-game-attendance, host-nudges, analytics-events | Analytics = code/SQL audit |
| `phase1b` | availability-poll | Monrovia host + member |
| `phase1c` | rotation-pairing, mini-tournament, rally-leaderboard | Leaderboard partially proved on Members tab |
| `phase2-recap` | post-game-recap | After attendance |
| `phase2-game-card` | module-game-card | Needs open pickup + rally hero |
| `ops` | crew-dormancy-nudge | Dev hook + device push |

Start: `./.cursor/hooks/validation-loop-start.sh --queue phase1a --from flow-post-game-attendance --builder`

## Device / human only

| Item | Why |
|------|-----|
| `flow-push-notifications-device` | Physical device + push |
| `gtm1-launch-gate` | HTTPS universal links, install landing |
| `flow-crew-dormancy-nudge` (push row) | Notification delivery |
| `flow-post-game-recap` P1 share | Share sheet on device |
| `flow-mini-tournament` | Two-account device QA preferred |

## SERVICE_ROLE_KEY vs Supabase CLI

| Path | Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env`? |
|------|---------------------------------------------|
| `supabase db query --linked` | **No** — uses CLI login |
| `node scripts/seed-monrovia-….mjs` | **Yes** for Auth Admin API — or use `./scripts/seed-monrovia-linked.sh` which runs `supabase projects api-keys` |

Your `.env` correctly has only `SUPABASE_URL` + `SUPABASE_ANON_KEY` for the app.
