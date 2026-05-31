# Phase 3 Partner Matching Validation Checklist

Last updated: 2026-03-15 (Case 1 Android pass and resolution notes added)

Use this checklist to validate the full partner-matching flow with two real accounts.

## Preconditions

- App build is updated with latest Phase 2 + Phase 3 UI/features.
- Supabase project is reachable from both test devices.
- Two confirmed user accounts are available:
  - Account A (host)
  - Account B (joiner)
- At least one sports location is available in `activity_locations` near test area.

## Platform Matrix

- [ ] iOS pass
- [ ] Android pass

Run all core cases below on both platforms.

## Case 1: Geolocation Permission + Live Location

| Status | Notes |
|--------|-------|
| Pass (Android, 2026-03) | **Why it succeeds:** (1) Expo modules added on Android (`expo` package + `expoAutolinking.useExpoModules()` in `android/settings.gradle`) so `globalThis.expo` is set and expo-location no longer crashes with EventEmitter undefined. (2) `getCurrentLocation()` uses `getCurrentPositionAsync` then `getLastKnownPositionAsync` fallback so location resolves (first attempt or cached/mock). Create activity no longer crashes; location visible in Location debug (dark) panel. See [ANDROID-LOCATION-ISSUE-CONTEXT.md](ANDROID-LOCATION-ISSUE-CONTEXT.md) § Resolution. |

Steps:

1. Open app with a signed-in account.
2. Deny location permission once, then re-enable from OS settings.
3. Return to app and refresh location-dependent views.

Expected:

- App handles permission denial without crash.
- After enabling, Discover/Map begin showing location-based content.

Failure signals:

- App stays stuck with no recovery after enabling permission.
- Location-dependent content never refreshes.

## Case 2: Geofence Detection Prompt

| Status | Notes |

Steps:

1. With Account A signed in, stay near a known sports location.
2. Wait for geofence polling interval to trigger.
3. Confirm activity confirmation modal appears ("Are you playing here?").

Expected:

- Geofence can detect nearby sports location and open modal.
- Modal closes/continues cleanly without UI deadlock.

Failure signals:

- Modal never appears despite nearby known location.
- Modal appears repeatedly for same location in a loop.

## Case 3: Create Activity + Discover Listing

| Status | Notes |

Steps:

1. Use `Create Activity` path (`Discover`, `Map`, or direct screen).
2. Select location, sport, duration, visibility, open slots.
3. Submit creation.
4. Verify activity appears in Discover feed and Map pins.

Expected:

- Activity creation succeeds and routes to activity detail.
- New activity is visible in nearby feed for eligible users.

Failure signals:

- Create call succeeds but activity not visible in Discover/Map.
- Detail screen opens with missing/incorrect data.

## Case 4: Join Request Flow (Two Accounts)

| Status | Notes |

Steps:

1. Account A creates activity.
2. Account B finds activity and taps `Request to Join`.
3. Account A opens activity detail and reviews pending requests.
4. Account A approves request.

Expected:

- Join request is created once (no duplicate rows).
- Host can approve request from activity detail.
- Activity player count increments after approval.

Failure signals:

- Duplicate pending requests from single tap.
- Host cannot approve/reject due to permissions or UI failure.
- Player count not updated after approval.

## Case 5: Friend Request + Accept

| Status | Notes |

Steps:

1. Account A sends friend request to Account B from Friends tab.
2. Account B sees incoming request and accepts.
3. Verify both accounts show friendship in Friends list.

Expected:

- Incoming/outgoing request states are correct.
- Accepted friendship appears for both users.

Failure signals:

- Request sent but not visible to recipient.
- Accepted request does not convert into friend list entry.

## Case 6: Quick Match Behavior

| Status | Notes |

Steps:

1. In Discover, tap `Quick Match` with active activities available.
2. Repeat when no activities are available.

Expected:

- With activities: opens activity detail directly.
- Without activities: routes to create activity flow.

Failure signals:

- `Quick Match` does nothing or routes incorrectly.

## Verification SQL (Supabase)

```sql
-- Latest activities
select id, user_id, sport_type, start_time, player_count, missing_players, status, created_at
from activities
order by created_at desc
limit 20;
```

```sql
-- Join requests and statuses
select id, activity_id, user_id, status, requested_at, responded_at
from join_requests
order by requested_at desc
limit 20;
```

```sql
-- Friend relationships and statuses
select id, user_id, friend_id, status, created_at
from friends
order by created_at desc
limit 20;
```

## Phase 3 Exit Criteria

- [ ] Geolocation permission/recovery validated.
- [ ] Geofence detection validated.
- [ ] Activity create + nearby listing validated.
- [ ] Join-request flow validated with two accounts.
- [ ] Friend request/accept flow validated with two accounts.
- [ ] Quick Match behavior validated.

## Results Logging

- Record detailed outcomes in `docs/phase-3-validation-results.md` immediately after each platform pass.

