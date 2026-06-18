#!/usr/bin/env bash
# EAS Build: write .env from EAS environment variables for react-native-config.
# Local dev still uses your own .env (gitignored); this runs only on EAS builders.
set -euo pipefail

ENV_FILE="${ENVFILE:-.env}"

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_ANON_KEY:-}" ]]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set on EAS for this profile."
  echo "  eas env:list --environment preview"
  echo "  eas env:create preview --name SUPABASE_URL --value \"...\" --visibility secret --non-interactive"
  exit 1
fi

{
  printf 'SUPABASE_URL=%s\n' "$SUPABASE_URL"
  printf 'SUPABASE_ANON_KEY=%s\n' "$SUPABASE_ANON_KEY"
  [[ -n "${GOOGLE_PLACES_API_KEY:-}" ]] && printf 'GOOGLE_PLACES_API_KEY=%s\n' "$GOOGLE_PLACES_API_KEY"
  [[ -n "${GOOGLE_PLACES_API_KEY_ANDROID:-}" ]] && printf 'GOOGLE_PLACES_API_KEY_ANDROID=%s\n' "$GOOGLE_PLACES_API_KEY_ANDROID"
  [[ -n "${GOOGLE_MAPS_API_KEY_ANDROID:-}" ]] && printf 'GOOGLE_MAPS_API_KEY_ANDROID=%s\n' "$GOOGLE_MAPS_API_KEY_ANDROID"
  [[ -n "${SENTRY_DSN:-}" ]] && printf 'SENTRY_DSN=%s\n' "$SENTRY_DSN"
  # Coach/parent/student UI — set via eas.json profile env (closed beta testers).
  for cps_flag in \
    EXPO_PUBLIC_ENABLE_COACH_FOUNDATION \
    EXPO_PUBLIC_ENABLE_PARENT_STUDENT_CORE \
    EXPO_PUBLIC_ENABLE_PARENT_PILOT \
    EXPO_PUBLIC_ENABLE_COACH_OPS
  do
    cps_val="${!cps_flag:-}"
    [[ -n "$cps_val" ]] && printf '%s=%s\n' "$cps_flag" "$cps_val"
  done
} >"$ENV_FILE"

echo "eas-sync-env: wrote ${ENV_FILE} for react-native-config (Supabase + optional keys)."
