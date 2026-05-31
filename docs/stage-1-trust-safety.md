# Stage 1 — Trust & Safety (complete)

## Shipped

- **Report / block:** `user_blocks`, `user_reports`, `SafetyActionsSheet` on player profiles and 1:1 chat (Safety header).
- **No-shows:** `activity_no_shows`, host action after review window, count on profile + player modal.
- **Admin:** In-app **Admin** screen (`profiles.is_admin = true`) — pending queue with `@usernames`, **Suspend & close** (suspends user + marks all their pending reports reviewed), dismiss/review, restore, manual UUID fallback.
- **Suspend:** `is_suspended` blocks join requests and host push; set via admin screen or Supabase.
- **Quiet hours:** Profile → Safety; `send-push` respects UTC quiet window.
- **Legal:** Terms + waiver + location privacy on signup; `TosAcceptanceGate` for existing users missing acceptance.
- **Approximate location:** Bucketed distances on Discover cards; fuzzed map pins for non-hosts; copy on Discover/Map/Profile.
- **Guards:** Blocked users hidden from Discover; join/chat blocked; suspended users cannot join.

## Migrations

- `008_trust_safety.sql`
- `010_stage1_2_finish.sql` (legal columns, admin RPCs, trust stats)
- `024_admin_report_triage.sql` (`admin_get_report_queue`, `admin_triage_report`)

## Enable admin (one-time)

In Supabase SQL editor (replace with your user id):

```sql
update public.profiles
set is_admin = true
where id = 'YOUR-USER-UUID';
```

## QA checklist

1. Signup requires terms checkbox; gate appears if `tos_version` outdated.
2. Block user → Discover hides their games; join/chat fail.
3. Report → pending row; admin can dismiss/review/suspend.
4. Host no-show after review window → count increments on player profile.
5. Quiet hours 22–8 UTC → join push skipped during window.
6. Map pins offset for games you do not host; Discover shows `~250 m` style distances.
