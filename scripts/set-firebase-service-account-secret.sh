#!/usr/bin/env bash
# Upload Firebase service account JSON to Supabase for send-push (FCM HTTP v1).
#
# 1. Firebase Console → Project settings → Service accounts → Generate new private key
# 2. Save JSON outside git (e.g. ~/Downloads/rally-32e72-firebase-adminsdk.json)
# 3. Run:
#      FIREBASE_SA_JSON=~/Downloads/rally-32e72-firebase-adminsdk.json \
#        bash scripts/set-firebase-service-account-secret.sh
set -euo pipefail

cd "$(dirname "$0")/.."

SUPABASE_REF="${SUPABASE_PROJECT_REF:-casljueycxsqexpkdiuq}"
JSON_FILE="${FIREBASE_SA_JSON:-}"

if [[ -z "$JSON_FILE" || ! -f "$JSON_FILE" ]]; then
  echo "ERROR: Set FIREBASE_SA_JSON to your Firebase Admin SDK JSON file path."
  echo ""
  echo "Download from:"
  echo "  https://console.firebase.google.com/project/rally-32e72/settings/serviceaccounts/adminsdk"
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: supabase CLI required."
  exit 1
fi

echo "Setting FIREBASE_SERVICE_ACCOUNT_JSON on $SUPABASE_REF ..."
supabase secrets set "FIREBASE_SERVICE_ACCOUNT_JSON=$(cat "$JSON_FILE")" --project-ref "$SUPABASE_REF"

echo "Deploying send-push ..."
supabase functions deploy send-push --project-ref "$SUPABASE_REF"

echo "Done. Legacy FIREBASE_SERVER_KEY is no longer used by send-push."
