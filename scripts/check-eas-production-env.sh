#!/usr/bin/env bash
# CI: ensure required EAS env vars exist for production builds (names only, not values).
set -euo pipefail

if [[ -z "${EXPO_TOKEN:-}" ]]; then
  echo "SKIP: EXPO_TOKEN not set (add GitHub secret to enable EAS env check)."
  exit 0
fi

cd "$(dirname "$0")/.."

echo "== EAS production environment =="
LIST="$(npx eas-cli env:list --environment production --non-interactive 2>&1)" || {
  echo "$LIST"
  exit 1
}

echo "$LIST" | grep -q 'SUPABASE_URL' || {
  echo "ERROR: SUPABASE_URL missing on EAS production. Run: eas env:create production --name SUPABASE_URL ..."
  exit 1
}

echo "$LIST" | grep -q 'SUPABASE_ANON_KEY' || {
  echo "ERROR: SUPABASE_ANON_KEY missing on EAS production."
  exit 1
}

echo "OK: required Supabase keys present on EAS production."
