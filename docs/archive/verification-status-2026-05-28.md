# Verification status (pickleball MVP)

Last updated: 2026-05-29

Summary of what is **done in code** vs what still needs **device sign-off** (mostly post-preview).

## Completed (code + manual smoke)

| Area | Status | Evidence |
|------|--------|----------|
| Pickleball-only launch | Done | `sports.ts` `launchEnabled` |
| Create Game map + courts | Done | `CreateActivityScreen` |
| Start time picker (fixed) | Done | DateTimePicker on create |
| Activity Detail hero + time | Done | `ActivityDetailScreen` |
| My Games (host + joined) | Done | Profile → `getMyGames` |
| Join request (2 accounts) | Done | Guest requests; host approves |
| In-app join alert (host) | Done | Realtime on Activity Detail while open |
| Activity chat after 2 players | Done | `canOpenActivityChat` + auto-create on approve |
| Player profile modal | Done | Tap host / players / requesters |
| Listing expiry | Done | `expires_at` + `expireStaleActivities` |
| Host extend start + expiry | Done | Extend on Activity Detail |
| Push server trigger on join | Done | `send-push` + `FIREBASE_SERVER_KEY` on Supabase |
| Review prompts | Done | Profile → Rate your partners |
| Discover sort by distance + refresh | Done | `sortActivitiesByDistance`, focus refetch |
| Join button states | Done | pending / approved / rejected copy |
| Unit tests | Done | `npm test` |
| Join smoke doc | Done | `smoke-test-join-pickleball.md` |
| Bay Area court seeds | Done | `seed-bay-area-courts.mjs` |

## Deferred (post-preview device QA)

| Area | When | Doc |
|------|------|-----|
| Push E2E (Cases 1–5) | After preview on physical iPhone | [post-preview-testing-backlog.md](post-preview-testing-backlog.md) |
| APNs `.p8` in Firebase Console | One-time before iOS push works | `scripts/setup-apns-firebase.sh --open` |
| Phase 3 Cases 1–2, 5–6 on device | Preview smoke | [phase-3-validation-results.md](phase-3-validation-results.md) |

## Partial / backlog (not blocking preview)

| Area | Notes |
|------|--------|
| Discover rating filter | Deferred until review volume |
| Phase 6 flex full matrix | Optional MVP path |
| Review abuse controls | Phase 7 backlog |
| Chat moderation | Phase 9 backlog |

## Phase 3 checklist (suggested ticks)

- [x] Case 3: Create activity + Discover listing (pickleball courts seeded)
- [x] Case 4: Join request flow — [smoke-test-join-pickleball.md](smoke-test-join-pickleball.md)
- [ ] Case 1: Location permission (both platforms) — preview smoke
- [ ] Case 2: Geofence modal — preview smoke
- [ ] Case 5: Friends (if shipping friends in MVP)
- [ ] Case 6: Quick Match (nearest game — now sorted by distance)

## Next development focus

1. **EAS preview build** — internal testers on real devices.
2. **Phase 3 preview smoke** — run [smoke-test-join-pickleball.md](smoke-test-join-pickleball.md) on preview builds.
3. **Post-preview** — [post-preview-testing-backlog.md](post-preview-testing-backlog.md) (push + full Phase 3 matrix).
