# Pickleball MVP — validation notes

Last updated: 2026-05-28 (evening pass)

Manual review from simulator screenshot + code audit **before** broader device QA. Use with Phase 3 checklists after fixes land.

## What changed (this pass)

| Area | Change |
|------|--------|
| Sport config | Pickleball only `launchEnabled`; default scheduling **fixed** |
| Discover | Title “Pickleball near you”; no sport chips when single sport |
| CTAs | **Create Game** primary; Quick Match secondary |
| Location | Setup card instead of orange warning strip |
| Debug | Location debug panel hidden unless `EXPO_PUBLIC_SHOW_LOCATION_DEBUG=true` |
| Create | Map + bottom court list; 5 km then 25 km search; distance labels; no auto global fallback |
| Data | Run `supabase/scripts/seed_bay_area_pickleball_courts.sql` for simulator-friendly courts |
| My Games | Profile lists hosted + joined games |
| Activity Detail | Hero card, time, players, extend, join realtime |
| Expiry | `expires_at` defaults to start; auto-`completed` when past; host can extend |

## Observed issues (from 2026-05-28 simulator)

### UX / product

| ID | Severity | Issue | Notes |
|----|----------|-------|-------|
| UX-1 | High | Location permission undetermined blocks nearby feed | Expected until user taps **Enable location**; copy improved but flow still needs Phase 3 Case 1 sign-off |
| UX-2 | Med | Empty state with no seeded pickleball games | Normal for new DB; need test data or seed pickleball `activity_locations` |
| UX-3 | Med | Legacy courts may be Tennis/Badminton in DB | Create flow offers “Show all courts” fallback until pickleball locations exist |
| UX-4 | Low | Quick Match opens first list item only | Acceptable MVP; later: rank by distance/slots/skill |

### Technical (from on-screen errors)

| ID | Severity | Issue | Next step |
|----|----------|-------|-----------|
| T-1 | High | `Failed to get device token` (simulator) | Expected on simulator; use physical device + APNs for push |
| T-4 | Med | Host no push on join (background) | Realtime alert while Activity Detail open; **push on preview device** after APNs upload |
| T-5 | Med | Past games still in feed | Fixed: `expireStaleActivities` + `expires_at` migration `007` |
| T-2 | Med | Metro: logs in DevTools not terminal | Press `j` in Metro or use screenshot; optional diagnostics screen later |
| T-3 | Low | Watchman recrawl warning | `watchman watch-del` per Metro hint; non-blocking |

### Removed / gated

| ID | Issue | Resolution |
|----|-------|------------|
| G-1 | Location debug overlay on Discover | Gated behind `EXPO_PUBLIC_SHOW_LOCATION_DEBUG` |
| G-2 | Tennis/Badminton filter chips | Hidden when only one launch sport |

## Recommended test order (you + second account)

1. **Location** — grant permission, pull to refresh, confirm feed query runs.
2. **Create fixed game** — Set time now, pick court, publish; appears on Discover.
3. **Join flow** — second account requests join; host approves.
4. **Flexible game** — I'm flexible; submit preferences; host finalizes (Phase 6 checklist).
5. **Notifications** — after T-1 fixed (Phase 4).
6. **EAS preview build** — install on physical iPhone; repeat 1–3.

## Log access for agents

| Source | Agent can read? |
|--------|-----------------|
| Cursor terminal (Metro, `npm run ios`, EAS) | Yes |
| React Native DevTools (`j` in Metro) | User or paste export |
| On-device red error toasts | Screenshot from user |
| Supabase logs / SQL | Yes via MCP or SQL |

## Go / no-go for next code sprint

- **Go** for pickleball UX/config alignment (done in this pass).
- **Hold** store/preview release until Phase 3 Cases 1–4 pass on device and T-1 (push token) is triaged.
