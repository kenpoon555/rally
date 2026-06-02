# Next items (from product + data architecture review)

Items **not** covered in migration `031` / this pass. Use as the backlog for the next sprint.

## Product

1. **Profile attendance %** — Show “Attendance: X%” from `approved + ready_at before lock + not no_show` (view `user_attendance_stats` or client aggregate over last N crew games).
2. **Merge legacy per-game chat history** — Forward-only beta is OK; optional one-time merge of old `activity_group` messages into `crew_group` threads.
3. **Session-level vs crew-level pins** — Today: one pinned announcement per crew conversation. If hosts need per-game court notes, add `pinned_announcement` on `conversation_activities` or always show `activities.cost_note` on cards (cost on cards shipped in 031).
4. **Regulars → Crew naming** — DB still uses `regular_groups`; align all user-facing copy to “crew” and consider table rename later.
5. **Real routing / court photos** — Out of scope for chat pass; still on roadmap.
6. **Host schedule UX** — “Schedule next game” from crew screen (`openScheduleNext` on RegularsCrewScreen) if not fully wired.
7. **Unread / notification** — Crew message on non-current session: optional “activity_id” filter or jump-to-session from push payload.

## Data / platform

8. **Drop `activity_rsvps` table** — RPC deprecated in 031; remove table after confirming no analytics/BI depend on it.
9. **Orphan `activity_group` cleanup** — Deactivate `conversation_members` on pre-030 per-game crew chats or mark conversations archived.
10. **Full inbox RPC** — `get_inbox_message_previews` shipped; extend to unread counts + next crew game in one RPC if inbox load becomes slow.
11. **`profiles.timezone` UI** — Column added in 031; add Profile setting so session labels aren’t LA-default for non-LA users.
12. **Roster trigger vs RPC** — `sync_activity_roster_counts` trigger may interact with `join_crew_game` / `approve_join_request`; monitor for double-updates under load; add tests.
13. **Check constraint** — `player_count = 1 + approved_joins` as optional hard guarantee (031 uses trigger reconcile).
14. **Index on `messages(conversation_id, created_at desc)`** — If inbox/history queries slow at scale.

## QA / release

15. **Re-run beta seed** on preview after 031 (`seed_beta_test_data.sql`).
16. **Device QA** — Schedule 2nd game → same chat; Join without request; I’m in checkmarks; Discover join request unchanged.
17. **EAS preview rebuild** — Icon assets changed; new iOS/Android builds needed for home-screen icon fix.

## Review items intentionally deferred

- Full attendance analytics dashboard  
- Merging old chat histories  
- TestFlight / production icon marketing variants  
