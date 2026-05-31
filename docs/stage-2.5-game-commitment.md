# Stage 2.5 — Game Commitment Loop

Last updated: 2026-05-31

## Goal

Players commit before game time; host locks roster; flakes are trackable later.

## Shipped

| Feature | Migration / code |
|---------|------------------|
| Pre-game lobby chat | `012_pre_game_activity_chat.sql`, `ensure_activity_group_conversation` |
| Join limits (max 3 upcoming, no overlap) | `014_fix_join_requests_rls.sql`, `assert_user_can_join_activity` |
| **Mark Ready** (approved joiners) | `015_stage25_game_commitment.sql`, `set_game_ready` |
| **Leave game** (before finalize) | `leave_game` RPC + chat roster sync |
| **Finalize game** (fixed + flex) | `finalize_game_commitment` with ready gates |
| Profile past games + status labels | `getMyGames`, `getGameStatusLabel` |
| RLS fixes (join_requests ↔ activities) | `014` security definer helpers |
| **Flake score** (approved leave before finalize) | `018_stage25_flakes_chat_archive.sql`, `activity_game_flakes`, `get_profile_trust_stats.flake_count` |
| **Read-only past-game chat** | 72h grace after play ends, then `is_game_chat_archived` RLS + UI |

## Ready / finalize rules

- **Target roster** = host + `missing_players` (default 1 → 2 total).
- Host may **Finalize** when:
  - roster is full **and** enough players tapped **Ready**, OR
  - roster is short **but everyone in the room** has tapped **Ready** (unanimous).
- After finalize: **no leave**; same chat thread, roster locked.

## UI

- **Activity detail:** Mark Ready, Leave game, Finalize game (lock roster)
- **Profile:** Upcoming / Past games, simplified settings

## Stage 2.5 exit — complete

- [x] Flake score when approved player leaves before finalize (`activity_game_flakes`, shown on Profile + player modal)
- [x] Read-only chat archive **72h after play ends** (grace for post-game coordination)
- [x] ~~Block new join requests after finalize~~ — **Won't do (signed off 2026-05-31):** host and players negotiate roster changes in chat after finalize; trust via post-game reviews.

## Stage 3 next

Recurring games, invite-only/closed games, My Games tab, chat → next game invite.
