#!/usr/bin/env bash
# Re-seed production-linked Supabase for App Store review (same day as upload).
# Populates Play Discover, Inbox (Rallies/Games/Friends), and fixes demo display names.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 1/3 Auth users + court (service role)"
if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "WARN: SUPABASE_SERVICE_ROLE_KEY not set — skipping mjs (SQL-only if users exist)"
else
  node scripts/seed-monrovia-basketball-rally-demo.mjs
fi

echo "==> 2/3 Monrovia Rally base (SQL)"
supabase db query --linked -f supabase/scripts/seed_monrovia_basketball_rally_demo.sql

echo "==> 3/3 Store review overlay — Discover + Inbox"
supabase db query --linked -f supabase/scripts/seed_store_review_demo.sql

echo ""
echo "Done. Smoke test: marcus@rally-mvrhoops.demo / MonroviaHoops26!"
echo "  Play → Basketball / Pickleball / Badminton (games listed)"
echo "  Inbox → Rallies, Games, Friends (threads populated)"
echo "  Profile → Display name shows Marcus (not email)"
