# Release Readiness Checklist

Last updated: 2026-03-15

Use this doc as the **go/no-go gate** before shipping. Do not release until the gate below and the sections that follow are satisfied.

---

## Go/No-Go Gate (Required Before Release)

These must be **pass** before release. Check the linked result docs; do not rely on this checklist alone.

| Gate | Source | Requirement |
|------|--------|-------------|
| **Phase 3** | [phase-3-validation-results.md](phase-3-validation-results.md) | Platform Pass Matrix: **iOS all cases passed** and **Android all cases passed**. |
| **Phase 6–8** | [phase-6-8-validation-results.md](phase-6-8-validation-results.md) | Platform Pass Matrix: **iOS all cases passed** and **Android all cases passed**; Phase 6, 7, and 8 device validation boxes checked as completed. |

**How to use**

1. Run validation in order: Auth+Profile → Phase 3 → Phase 4 → Phase 6 → Phase 7 → Phase 8 (see PROJECT_CONTEXT.md Validation Order table).
2. Record results in the docs above; update their Platform Pass Matrix and case/device boxes.
3. Confirm this gate: both Phase 3 and Phase 6–8 result docs show all required platforms/cases passed.
4. Then complete the rest of this checklist (Security, Regression, Build, Rollout, Sign-off).

---

## Security and Config

- [x] `.env` is populated from `.env.example` on CI/local machines.
- [x] No production secrets are hardcoded in `src/constants/config.ts`.
- [x] Supabase URL/key values load from environment at runtime.
- [x] Google Places keys use platform restrictions.

**Verification (2026-03-15):** `config.ts` uses `readEnv()` for all keys; no literal URLs/keys in source. Supabase client and Google Places use `CONFIG.*`. `.env.example` documents required/optional vars. Platform restrictions for Places/Maps are applied in Google Cloud Console (API key restrictions by bundle ID / package name), not in code.

### Detailed steps (re-run when needed)

1. **`.env` from `.env.example`**  
   - Ensure `.env` exists (gitignored). Copy from `.env.example` and fill real values. On CI, inject vars from secrets; do not commit `.env`.

2. **No hardcoded secrets in `config.ts`**  
   - Run: `grep -r "supabase.co\|eyJ\|sk_live\|AIza" RallyApp/src --include="*.ts" --include="*.tsx"`. Expect only comments or test mocks (e.g. `jest.setup.js`), no production credentials.

3. **Supabase from env**  
   - Open `src/constants/config.ts`: `SUPABASE_URL` and `SUPABASE_ANON_KEY` must come from `readEnv(...)`. Open `src/services/api/supabase.ts`: client must use `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY`.

4. **Places from env**  
   - In `config.ts`, `GOOGLE_PLACES_API_KEY*` must come from `readEnv(...)`. Usage in `src/services/api/googlePlaces.ts` must use `CONFIG.GOOGLE_PLACES_API_KEY_PLATFORM` (or equivalent), not a literal key.

5. **Google Places/Maps key restrictions**  
   - In Google Cloud Console → APIs & Services → Credentials, ensure the key(s) used for Places and Maps have application restrictions (e.g. Android package name, iOS bundle ID) so they cannot be used from other apps.

## Core Regression (iOS + Android)

- [ ] Auth: signup/login/logout/profile auto-create.
- [ ] Discover: list/load/filter/quick match.
- [ ] Map: activity pins/location fallback/start-here flow.
- [ ] Friends: send/accept requests and list state transitions.
- [ ] Activity: create/list/join-request/approve player count update.
- [ ] Geofence: detect nearby location once without loop spam.

## Notifications

- [ ] Permission flow behaves correctly on first launch and after deny/re-enable.
- [ ] Device token is inserted/upserted in `user_device_tokens`.
- [ ] Token refresh updates registration without duplicates.
- [ ] Foreground, background, and cold-start notification open events pass.

## API and Data Integrity

- [ ] Supabase REST requests work with normalized base URL.
- [ ] `activities`, `join_requests`, `friends`, `user_device_tokens` tables show expected state after test flows.
- [ ] No critical errors in auth or API logs during regression run.

## Build and Quality Gates

- [ ] `npm run lint` passes (or only known non-blocking warnings remain with owner noted).
  - Current note: lint currently includes pre-existing `jest.setup.js` `no-undef` errors; application feature files pass diagnostics.
- [ ] `npm test -- --watch=false` passes (or failures are documented with fixes/owners).
- [ ] iOS debug build runs successfully.
- [ ] Android debug build runs successfully.

## Staged Rollout Plan

- [ ] Internal tester ring (team-only) receives build and validation script.
- [ ] Limited cohort (5-20 users) rollout with logging and crash watch.
- [ ] Wider rollout gate approved after 48h no P0/P1 issues.
- [ ] Rollback procedure and owner on-call schedule documented.

## Sign-off

- [ ] Product sign-off
- [ ] Engineering sign-off
- [ ] QA sign-off
- [ ] Release notes prepared

## Reference result docs

See **Go/No-Go Gate** above. Result docs: [phase-3-validation-results.md](phase-3-validation-results.md), [phase-6-8-validation-results.md](phase-6-8-validation-results.md). Auth/profile and Phase 4 results live in their respective checklists (see PROJECT_CONTEXT.md Validation Order).
