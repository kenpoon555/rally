# Smoke test: join a pickleball game (two accounts)

Last updated: 2026-05-28

~10 minutes. Run after Create Game + Activity Detail changes land.

## Preconditions

- App builds on simulator or device (`npm run ios` or EAS preview).
- Supabase has courts near your test location (run `node scripts/seed-bay-area-courts.mjs` if needed).
- Two accounts: **Host (A)** and **Guest (B)**.

## Steps

| Step | Who | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Discover → **Create Game** → pick court → **Set time now** → choose start time → **Publish Game** | Lands on Activity Details; game visible on Discover |
| 2 | A | Profile → **My Games** → tap the game | Same Activity Details (role: Hosting) |
| 3 | B | Sign in (second simulator, device, or sign out/in) | Discover shows A's game |
| 4 | B | Tap game card → **Request to Join** | Button becomes "Join request sent" |
| 5 | A | Activity Details → **Join Requests** → **Approve** | Guest appears under Players; player count increases |
| 6 | Both | **Open Game Chat** (visible when 2+ players) | Chat thread opens |
| 7 | B | Profile → **My Games** | Game listed with role **Joined** |

## Supabase checks (optional)

In SQL Editor:

```sql
select id, status, user_id from join_requests
where activity_id = '<activity-uuid>'
order by requested_at desc;

select id, player_count, match_status, start_time, expires_at from activities
where id = '<activity-uuid>';
```

- `join_requests.status` = `approved` for B
- `activities.player_count` = 2 (host + one guest)

## Host notifications

| Type | Works? |
|------|--------|
| In-app (Activity Detail open) | Yes — realtime alert + join list refresh |
| Push (background / locked phone) | After preview — code ready; needs physical iPhone + APNs upload |

## Common failures

| Symptom | Likely cause |
|---------|----------------|
| B sees no games | Location off, outside 5 km, or start time passed (listing expired) |
| Host sees no pending request | Re-open Activity Details; stay on screen for realtime |
| No Join button on host screen | Normal — host never sees Join |
| No chat button | Need 2+ players after approve; pull to refresh detail |
| Push errors on simulator | Expected — FCM on simulator |
| Game gone from Discover | Listing expired — host **Extend start time** on detail |

## Related docs

- [phase-3-partner-matching-validation-checklist.md](phase-3-partner-matching-validation-checklist.md)
- [pickleball-mvp-validation-notes.md](pickleball-mvp-validation-notes.md)
- [verification-status-2026-05-28.md](verification-status-2026-05-28.md)
