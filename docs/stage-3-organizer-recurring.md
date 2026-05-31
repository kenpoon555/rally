# Stage 3 — Organizer + Recurring Games

Last updated: 2026-05-31

## Goal

Turn one-off matches into repeat play: hosts keep their roster, players stay in-app instead of swapping numbers.

## Shipped

| Feature | Migration / code |
|---------|------------------|
| **72h post-game chat grace** | `019` — chat stays open after play ends |
| **Invite-only games** | `visibility = invite_only` — hidden from Discover |
| **Schedule next game** | `schedule_next_game_from_activity` RPC |
| **Recurring weekly series** | `020` — `game_series`, `make_activity_recurring`, `spawn_series_occurrence` |
| **My Games tab** | `MyGamesScreen` — Upcoming / Past / Hosting |
| **RSVP** | `activity_rsvps`, `set_game_rsvp`, `GameRsvpBar` on activity detail |
| **Invite links** | `invite_token`, `join_game_via_invite`, `rallyapp://invite/:token` deep links |
| **Need players tonight** | `urgency_level = tonight` — badge + Discover sort boost |
| **Badminton launch sport** | `sports.ts` — Discover filter + Create Game picker |

## Recurring flow

1. Host taps **Make weekly recurring** on a game (creates `game_series` + roster members).
2. **Schedule next game** uses `spawn_series_occurrence` when `series_id` is set.
3. New occurrences are invite-only with roster pre-approved.

## Invite links

Share from activity detail → `rallyapp://invite/{invite_token}`. Opens app, auto-joins when spots allow.

## Next (Stage 3–4)

- [ ] Auto-spawn series on cron (no host tap)
- [ ] Team/group schema (`teams`, `team_members`)
- [ ] Organizer dashboard + game-time blast

## Exit when

Hosts spin up repeat games from chat; invite-only + recurring work end-to-end for ~20 testers.
