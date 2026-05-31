# What's Next — Rally LA closed beta

Last updated: 2026-05-31

**Single checklist for "what do we do now?"** Engineering detail lives in [ROADMAP.md](../ROADMAP.md). Business stages live in [open_items.md](../../open_items.md).

**Beta market:** Los Angeles — courts seeded metro-wide; dev simulators fall back to central LA when GPS is off.

---

## Seed LA courts (one-time)

```bash
cd RallyApp
# Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
node scripts/seed-la-courts.mjs
```

Covers all 10 launch sports (pickleball through Ultimate). Idempotent — safe to re-run.

## Current focus

Prove the **free retention loop** before any paid feature work:

```text
Discover → join → Game Room chat → play → Regulars crew → replay (crew_replayed)
```

North-star metric: **`analytics_crew_lifecycle.retained`** (% of Regulars groups with ≥1 replay). See [stage-2-cost-metrics.md](stage-2-cost-metrics.md).

---

## Blocked (waiting on preview build)

| Item | Why blocked | Doc |
|------|-------------|-----|
| Physical smoke test | Need EAS **preview** on real iPhone/Android | [smoke-test-join-pickleball.md](smoke-test-join-pickleball.md) |
| Push notification QA | Simulators don't get APNs tokens | [post-preview-testing-backlog.md](post-preview-testing-backlog.md) |
| TestFlight / Play internal invite | Needs installable build | [beta-testflight-play-internal.md](beta-testflight-play-internal.md) |
| Phase 3 sign-off | Two-account E2E on device | [phase-3-validation-results.md](phase-3-validation-results.md) |

**In progress:** `eas build --profile preview --platform ios` (check terminal / EAS dashboard).

When the build lands → run **Post-preview testing backlog** only; do not start Stage 4–7 product work until crew replay data exists.

---

## Shipped this sprint (no device required to merge)

- [x] RSVP removed product-wide
- [x] **Rate Players** star-rating redesign
- [x] Crew analytics: `regular_group_created`, `crew_invite_redeemed`, `crew_replayed`
- [x] Dev diagnostics gated (`devFlags.ts` — off in preview/prod)
- [x] **Game Room:** tap roster avatars + join requests → player profile (ratings + trust)
- [x] **Join requests:** inline trust preview (`4.2★ · Reliable`, `New player`, etc.)
- [x] **Entitlements scaffold** — `user_entitlements`, `user_has_entitlement()`, `hasEntitlement()` / `useEntitlement()` (no paywall UI)
- [x] **10 launch sports** — 3 popular adds (Tennis, Volleyball, Soccer) + 4 partner/crew niches (Squash, Racquetball, Table Tennis, Ultimate Frisbee); Discover filter scroll

---

## Do now (while build runs)

| Priority | Task | Owner |
|----------|------|--------|
| 1 | ~~**Apply migration `026`**~~ to Supabase (`analytics_crew_funnel_30d`, `analytics_crew_lifecycle`) | **Done** (2026-05-31) |
| 2 | **Invite 5–10 LA beta testers** (pickleball/badminton/tennis hosts you know) — list names, don't wait for perfect | Product |
| 3 | ~~**Draft beta welcome message**~~ — [beta-welcome-message.md](beta-welcome-message.md) | **Done** (2026-05-31) |
| 4 | ~~Optional: thin **entitlements scaffold**~~ | **Done** (2026-05-31) |
| 5 | **Invite 5–10 LA beta hosts** — use welcome copy; list names | Product |
| 6 | **Run `node scripts/seed-la-courts.mjs`** against Supabase prod | Engineering |

---

## Do when preview build installs

1. Host + guest smoke: Discover → join → Game Room → Ready → Finalize → chat  
2. Regulars: **Save as Regulars group** → share link → guest joins → **Schedule next game**  
3. Host: pending join request shows trust line; tap name → full profile  
4. Post-game: **Rate Players** on Profile  
5. Log results in [phase-3-validation-results.md](phase-3-validation-results.md)

Full matrix: [physical-device-beta-test.md](physical-device-beta-test.md)

---

## Explicitly not next (gated)

- Teams / leagues UI (seed from Regulars when retention proven)
- Organizer Pro / Player Plus paywalls
- Waitlist (Stage 4)
- In-app analytics dashboard (query SQL views for now)

---

## Document map

| Doc | Purpose |
|-----|---------|
| **[NEXT.md](NEXT.md)** | This file — current sprint + blockers |
| [ROADMAP.md](../ROADMAP.md) | Engineering phases, shipped features, UX backlog |
| [open_items.md](../../open_items.md) | Business model, Stages 0–7, monetization gates |
| [stage-2-cost-metrics.md](stage-2-cost-metrics.md) | Rate limits, funnel SQL, crew retention queries |
| [stage-2.5-game-commitment.md](stage-2.5-game-commitment.md) | Finalize, Ready, leave, flakes |
| [stage-3-organizer-recurring.md](stage-3-organizer-recurring.md) | Recurring, invites, My Games |
| [stage-3.5-beta-polish-and-regulars.md](stage-3.5-beta-polish-and-regulars.md) | Regulars / Groups design |
| [post-preview-testing-backlog.md](post-preview-testing-backlog.md) | Device QA after first preview |
| [physical-device-beta-test.md](physical-device-beta-test.md) | Beta tester script |
| [beta-welcome-message.md](beta-welcome-message.md) | SMS/email copy for first testers |
| [court-data-strategy.md](court-data-strategy.md) | How courts stay fresh (Places, reports, seeds) |

---

## Leagues / teams (future entrances — not built)

When retention justifies it, entry points (no new tab):

1. **Chats → Regulars row** — league invite after N replays  
2. **Game Room post-game strip** — "Your crew played 4× — join summer league?"  
3. **Activity Details → Regulars** — convert crew → registered team  
4. **Profile section** — My crews / My leagues (hidden until relevant)

Badges to add later: **New**, **Rated**, **Reliable**, **Regular**, **League · [name]**, **Captain** — see product notes in chat history / ROADMAP Stage 3.5.
