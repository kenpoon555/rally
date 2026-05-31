# Phase 3 Partner Matching – Validation Results

Last updated: 2026-05-06

Record detailed outcomes here after each platform pass. Checklist and steps: [VALIDATION_PLAN.md](VALIDATION_PLAN.md).

---

## Phase 3 polish (2026-05-29)

Code pass before preview (no device QA required):

- Discover lists games **nearest first** (`sortActivitiesByDistance`).
- **Quick Match** opens the closest open game.
- Discover **refetches on tab focus** and when location becomes available.
- Join button shows **pending / approved / rejected** states clearly.
- Stale “Phase 4 not built” copy removed from Activity Detail.

**Run on preview builds:** [smoke-test-join-pickleball.md](smoke-test-join-pickleball.md) + Cases 1–2, 6 in table below.

---

## Automated verification (CI bundle — 2026-05-06)

Run `./scripts/verify-release-bundle.sh` from `RallyApp/` (or `npm test` + `npm run lint`).

| Check | Status |
| ----- | ------ |
| `npm test` (includes `activityWithinRadius` / Discover distance gate regression tests) | PASS |
| `npm run lint` | PASS (warnings only; see release checklist) |

These cover **Case 3** logic fixes documented below (flex time filter + include activities without resolved coordinates). They **do not** replace physical Cases 1–2 (permissions/geofence), two-account Cases 4–5, or Case 6 — complete those on hardware/emulators per runbook.

---

## How to run Phase 3 device QA (steps)

**Before you start**

- [X] App built with latest code (`npx react-native run-ios` / `run-android`; Metro running).
- [X] Two test accounts signed up and signed in: **Account A** (host), **Account B** (joiner).
- [ ] At least one sports location in `activity_locations` near your test area (or use Create Activity to add one).
- [ ] Supabase project reachable from device/emulator.

**Run order:** Do **Case 1 → 2 → 3 → 4 → 5 → 6** on **one platform** (e.g. Android), then repeat on the other (e.g. iOS). After each case, fill **Status** and **Notes** in the Case Results table below (and optionally in [VALIDATION_PLAN.md](VALIDATION_PLAN.md) per case).

---

### Case 1: Geolocation permission + live location

1. Open app with a signed-in account.
2. Deny location permission when prompted (or turn off in OS settings).
3. Re-enable location in OS settings and return to app.
4. Refresh location-dependent views (e.g. pull-to-refresh on Discover, or open Map).

**Pass:** No crash on deny; after re-enable, Discover/Map show location-based content.  
**Record:** Case Results table → Case 1 → your platform column.

---

### Case 2: Geofence detection prompt

1. With **Account A** signed in, be physically (or in emulator: set mock location) near a known sports location.
2. Wait for the geofence polling interval to run (or trigger by opening/closing app or waiting per app config).
3. Check whether the activity confirmation modal appears (“Are you playing here?”).

**Pass:** Modal appears when near location; modal dismisses without freezing.  
**Fail:** Modal never appears despite being near; or modal loops.  
**Record:** Case Results table → Case 2.

---

### Case 3: Create activity + Discover listing

1. From Discover, Map, or direct entry, open **Create Activity**.
2. Select location, sport, duration, visibility, open slots.
3. Submit. Confirm you land on activity detail.
4. Open **Discover** and **Map** and confirm the new activity appears in feed and as a pin.

**Pass:** Create succeeds; activity visible in Discover and Map.  
**Fail:** Create succeeds but activity missing or wrong in feed/Map.  
**Record:** Case Results table → Case 3.

---

### Case 4: Join request flow (two accounts)

1. **Account A:** Create an activity (as in Case 3).
2. **Account B:** Find that activity (Discover or Map), tap **Request to Join**.
3. **Account A:** Open that activity’s detail, open pending requests, approve Account B.
4. Confirm player count increases and join state looks correct.

**Pass:** One join request per tap; host can approve; player count updates.  
**Fail:** Duplicate requests; host can’t approve; count wrong.  
**Record:** Case Results table → Case 4.

---

### Case 5: Friend request + accept

1. **Account A:** Friends tab → send friend request to **Account B**.
2. **Account B:** See incoming request and accept.
3. On both accounts, open Friends list and confirm they see each other as friends.

**Pass:** Request visible to B; after accept, both show as friends.  
**Fail:** Request not visible; accept doesn’t update list.  
**Record:** Case Results table → Case 5.

---

### Case 6: Quick Match behavior

1. In **Discover**, tap **Quick Match** when there are active activities.
2. Confirm it opens an activity detail (or correct flow).
3. Tap **Quick Match** again when there are **no** active activities.
4. Confirm it routes to create-activity (or correct empty state).

**Pass:** With activities → detail; without → create flow.  
**Fail:** Wrong screen or no navigation.  
**Record:** Case Results table → Case 6.

---

### After each platform

- Update the **Case Results** table with Pass/Fail and short notes per case.
- If all six cases passed on that platform, check the corresponding box in **Platform Pass Matrix** (iOS or Android).
- Optionally run **Verification SQL** in Supabase (see below) to spot-check activities, join_requests, friends.
- Update **Exit Criteria** checkboxes when the corresponding case is passed on both platforms.
- Log any defects in **Defects / notes**.

---

## Platform Pass Matrix

| Track | Status | Notes |
| ----- | ------ | ----- |
| Automated unit + lint bundle (`verify-release-bundle.sh`) | **PASS** | 2026-05-06 |
| iOS — Cases 1–6 on device/emulator | Pending | Complete Case Results table |
| Android — Cases 1–6 on device/emulator | Pending | Complete Case Results table |

Legacy shortcuts:

- [ ] iOS — all cases passed
- [ ] Android — all cases passed

*(Case 1 Android partial 2026-03; Cases 2–6 not fully run on device.)*

## Case Results

| Case | Name | iOS Status | iOS Notes | Android Status | Android Notes |
|------|------|------------|-----------|----------------|---------------|
| 1 | Geolocation permission + live location | | | Partial (2026-03-17) | Permission granted, but `getCurrentPositionAsync` fails on emulator AND `getLastKnownPositionAsync` returned null (requiredAccuracy: 500 was too strict — filtered out network/wifi positions). Fixed 2026-03-17: relaxed requiredAccuracy to 10000m + added no-constraint final fallback. Re-test needed. |
| 2 | Geofence detection prompt | | | | |
| 3 | Create activity + Discover listing | Partial (2026-03-17) | Create succeeds on iOS; row visible in Supabase. Activity NOT showing in Discover — two bugs found and fixed: (1) `start_time >= now()` filter dropped flex activities whose start_time = creation time; fixed to `OR window_end >= now()`. (2) Distance filter silently dropped activities with unresolved location join; changed to `return true` when no coordinates. Re-test needed. | | |
| 4 | Join request flow (two accounts) | | | | |
| 5 | Friend request + accept | | | | |
| 6 | Quick Match behavior | | | | |

## Exit Criteria (from VALIDATION_PLAN)

- [ ] Geolocation permission/recovery validated.
- [ ] Geofence detection validated.
- [ ] Activity create + nearby listing validated.
- [ ] Join-request flow validated with two accounts.
- [ ] Friend request/accept flow validated with two accounts.
- [ ] Quick Match behavior validated.

## Verification SQL

Use [VALIDATION_PLAN.md § Verification SQL](VALIDATION_PLAN.md) for ad-hoc checks: latest activities, join requests, friend relationships.

## Defects / notes

**2026-03-17 – Android emulator getLastKnownPositionAsync returns null**  
Root cause: `requiredAccuracy: 500` filtered out network/wifi-positioned fixes (accuracy reported > 500m on emulator). User had visible location in Google Maps but our fallback discarded it. Fix: relaxed to `requiredAccuracy: 10000` + added a no-constraint final attempt. See `locationService.ts` `getCurrentLocation()`. Re-run Case 1 on Android after hot-reload.

**2026-03-17 – iOS Case 3: activity created but missing from Discover (two bugs fixed)**

Root causes found:
1. **Time filter too strict for flex activities** — `getNearbyActivities` used `.gte('start_time', now)`. Flex activities set `start_time` = creation time (immediately in the past), so they were filtered out before any distance check. Fixed: changed to `.or('start_time.gte.{now},window_end.gte.{now}')` so flex activities are included while their `window_end` is in the future.
2. **Distance filter silently dropped activities with no resolved location** — when the `activity_locations` join returned `null` (missing coordinates), the filter returned `false` and removed the activity. Fixed: changed to `return true` when `coordinates` is unavailable, so activities are shown (without distance filtering) rather than silently dropped.

File changed: `src/services/activityService.ts` → `getNearbyActivities()`.
