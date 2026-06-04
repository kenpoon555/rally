# Handoff: sport-specific matching (Phase 1 wedge)

Last updated: 2026-04-11

Use this when **another agent or developer** picks up Rally after the sport-matching work. It summarizes **what changed**, **how to test without getting stuck on devices**, and a **copy-paste prompt** for the next session.

---

## What was updated (changelog)

### Product lock

- **Phase 1 profile:** `partnerFlex` (flexible window + preferences + finalize RPC).
- **Launch sports (UI only):** **Tennis** and **Badminton** — other sports stay in the enum for legacy DB rows but are hidden from Discover / Create sport pickers until you flip `launchEnabled` in config.

### Code

| Area | Change |
|------|--------|
| [`src/constants/sports.ts`](../src/constants/sports.ts) | `SPORT_METADATA`, `MatchingProfile`, `launchEnabled`, `defaultSchedulingMode`, helpers `getSportMetadata`, `resolvePreferredSportForLaunch`, `LAUNCH_SPORT_TYPES`; Activity Detail copy: `ACTIVITY_DETAIL_COPY_BY_PROFILE`, `getActivityDetailMatchingCopy`, `resolveMatchingProfileForActivity`. |
| [`src/pages/Activity/ActivityDetailScreen.tsx`](../src/pages/Activity/ActivityDetailScreen.tsx) | Status / flex preference / finalize / collecting-deadline copy driven by `matchingProfile` via `getActivityDetailMatchingCopy`. |
| [`src/hooks/useSportsCatalog.ts`](../src/hooks/useSportsCatalog.ts) | Returns `sports` (launch-only) and `allSports` (full metadata). |
| [`src/pages/Activity/CreateActivityScreen.tsx`](../src/pages/Activity/CreateActivityScreen.tsx) | Defaults from `resolvePreferredSportForLaunch`; scheduling mode follows sport metadata (Tennis/Badminton → flex). |
| [`src/pages/Home/HomeScreen.tsx`](../src/pages/Home/HomeScreen.tsx) | Geofence modal suggested sport uses `resolvePreferredSportForLaunch`. |
| [`src/components/ActivityConfirmationModal.tsx`](../src/components/ActivityConfirmationModal.tsx) | Quick-create uses flex path when metadata says flex (window + `collecting` + candidates). |

### Docs

| Doc | Purpose |
|-----|---------|
| [`docs/sport-matching-profiles.md`](sport-matching-profiles.md) | Lock `partnerFlex` + Tennis/Badminton. |
| [`docs/phase2-fast-fixed-matching.md`](phase2-fast-fixed-matching.md) | Phase 2 `fastFixed` plan. |
| [`docs/chat-mvp-boundary.md`](chat-mvp-boundary.md) | Chat scope vs scale-later work. |
| [`docs/agent-workstreams-sport-matching.md`](agent-workstreams-sport-matching.md) | Parallel workstreams. |
| [`ROADMAP.md`](../ROADMAP.md) | Sport-specific matching section. |
| [`docs/TASKS.md`](TASKS.md) | Sport-matching rows marked done. |
| [`docs/v2-v4-implementation-backlog.md`](v2-v4-implementation-backlog.md) | Config source-of-truth note. |
| [`CLAUDE.md`](../CLAUDE.md) | `useSportsCatalog` behavior. |

---

## How to test it (avoid device pain first)

**Principle:** Validate **logic and UI on simulator/emulator** first; reserve **physical devices** for push, flaky GPS, and cross-platform release gates.

### Tier 0 — No device (fast)

```bash
cd RallyApp
npm test
npm run lint
```

- Confirms JS bundle and tests still run. (Project may have pre-existing lint noise in tests; fix only if you touch those files.)

### Tier 1 — Simulator / emulator (recommended for this feature)

1. `.env` has `SUPABASE_URL` and `SUPABASE_ANON_KEY` (see `.env.example`).
2. Terminal A: `npm start`
3. Terminal B: `npx react-native run-ios` or `npx react-native run-android`

**What to verify (sport matching):**

- **Discover:** Sport filter chips show **only Tennis and Badminton** (plus “All sports” behavior if present).
- **Create Activity:** Sport pills are **only** Tennis / Badminton; default scheduling tends to **Flexible** for those sports.
- **Sign in** → create a flex activity → open **Activity detail** → confirm `collecting` / flex copy appears as before.

**Location on emulator:** If location is flaky, use the steps in [`docs/current-setup-app-guide.md`](current-setup-app-guide.md) (mock location / refresh). Do **not** treat emulator GPS issues as sport-config bugs until real-device check.

### Tier 2 — Real device (later / batched)

Use when you need **true GPS**, **geofence modal**, or **push notifications**. Follow [`docs/current-setup-app-guide.md`](current-setup-app-guide.md) and Phase 3/4 checklists in [`docs/TASKS.md`](TASKS.md).

**Do not** block Tier 1 sign-off on Tier 2.

---

## What the next agent should *not* assume

- Editing **`SPORT_METADATA`** is how you add sports or switch profiles — **no** migration needed for profile flips if DB already supports `fixed` / `flex`.
- Old activities may still show **Basketball** etc. in feeds — that is expected until data ages out or you filter server-side later.

---

## Copy-paste: ask the next agent

Use a single message like this (adjust the goal line):

```
Read RallyApp/docs/HANDOFF-sport-matching.md first.

Context: Phase 1 sport wedge is implemented (partnerFlex, Tennis + Badminton only in Discover/Create).
Goal: <your next task, e.g. "ActivityDetail copy driven by matchingProfile" or "run Phase 3 Case 3 on iOS simulator only">

Constraints:
- Do not edit .cursor/plans/* plan files unless I ask.
- Prefer simulator/emulator for UI; defer real-device QA unless the task requires GPS/push.
- Source of truth for sports: src/constants/sports.ts

Deliver: code or doc updates + what you tested (Tier 0 / Tier 1 / Tier 2).
```

---

## Related

- Full setup: [`docs/current-setup-app-guide.md`](current-setup-app-guide.md)
- Phase 3 validation log: [`docs/phase-3-validation-results.md`](phase-3-validation-results.md)
- Task index: [`docs/TASKS.md`](TASKS.md)
