# Issue: Supabase REST trailing-slash endpoint returns 404

Status: Closed (fixed via base URL normalization)  
Owner: RallyApp  
First observed: 2026-02-21

## Summary

Supabase REST requests to table routes with a trailing slash return `404` for this project, while the same routes without trailing slash return `200`.

Example:

- Works: `/rest/v1/profiles?select=id&limit=1` -> `200`
- Fails: `/rest/v1/profiles/?select=id&limit=1` -> `404`

This caused profile fetch/insert calls to fail and surfaced in app as misleading "database setup incomplete" errors.

## Impact

- Signup/auth appears to succeed, but profile lifecycle fails.
- Repeated failures in:
  - `getCurrentUser()`
  - `createUserProfile()`
  - Post-signup load flow
- User-facing confusion and broken onboarding path.

## Evidence

- Supabase API logs show repeated `404` for:
  - `GET /rest/v1/profiles/?select=...`
  - `POST /rest/v1/profiles/?select=*`
- Direct check confirmed behavior mismatch:
  - no trailing slash -> `200`
  - trailing slash -> `404`

## Initial Mitigation (Historical)

File: `src/services/api/supabase.ts`

- Temporary fetch-level rewrite was used to normalize table URLs at request time.

## Root Cause Hypothesis

- Supabase project URL could be configured with a trailing slash in app config.
- Trailing slash in base URL cascaded into malformed REST table routes in some paths.
- Not a migration/schema absence issue (table exists and is queryable without trailing slash).

## Implemented Fix

1. Normalize `SUPABASE_URL` once at client creation (`/+$` stripped).
2. Remove the custom global fetch URL rewrite workaround.
3. Keep client usage on default Supabase behavior.

## Acceptance Criteria for Closure

- `SUPABASE_URL` with trailing slash no longer causes malformed REST routes.
- App works with default Supabase client request behavior.
- Signup -> profile create/fetch flow remains functional with normalized base URL.
