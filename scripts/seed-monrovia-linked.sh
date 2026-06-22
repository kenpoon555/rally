#!/usr/bin/env bash
# Re-seed Monrovia basketball Rally demo on the linked Supabase project.
# Uses Supabase CLI for service_role (no SUPABASE_SERVICE_ROLE_KEY in .env required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-casljueycxsqexpkdiuq}"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI required (https://supabase.com/docs/guides/cli)" >&2
  exit 1
fi

if [[ -z "${SUPABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a && source .env && set +a
  fi
fi

if [[ -z "${SUPABASE_URL:-}" ]]; then
  echo "Set SUPABASE_URL in .env (anon key is enough for the app; seed uses CLI service_role)." >&2
  exit 1
fi

echo "Fetching service_role from Supabase CLI (project $PROJECT_REF)..."
SUPABASE_SERVICE_ROLE_KEY="$(
  supabase projects api-keys --project-ref "$PROJECT_REF" -o json \
    | python3 -c "import sys,json; keys=json.load(sys.stdin); print(next(k['api_key'] for k in keys if k.get('name')=='service_role'))"
)"

export SUPABASE_SERVICE_ROLE_KEY

echo "Step 1/2: JS seed (auth users + Rally data)..."
node scripts/seed-monrovia-basketball-rally-demo.mjs

echo "Step 2/2: SQL seed (upcoming session reset + crew chat)..."
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql

echo "Done. Login: marcus@rally-mvrhoops.demo / MonroviaHoops26!"
