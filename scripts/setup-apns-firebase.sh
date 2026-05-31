#!/usr/bin/env bash
# Upload APNs auth key to Firebase (console step — no public Firebase CLI/API for .p8 upload).
# Validates local key + Supabase push secret, then opens Cloud Messaging settings.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_ID="${FIREBASE_PROJECT_ID:-rally-32e72}"
IOS_APP_ID="${FIREBASE_IOS_APP_ID:-1:567443883022:ios:412841b0fc29cbe1ac685f}"
SUPABASE_REF="${SUPABASE_PROJECT_REF:-casljueycxsqexpkdiuq}"

echo "== Rally APNs + push secret check =="
echo

# --- APNs key (.p8) ---
P8_FILE="${APNS_KEY_PATH:-}"
if [[ -z "$P8_FILE" ]]; then
  P8_FILE="$(find "$ROOT" -maxdepth 2 -name 'AuthKey_*.p8' -print -quit 2>/dev/null || true)"
fi

if [[ -z "$P8_FILE" || ! -f "$P8_FILE" ]]; then
  echo "ERROR: No AuthKey_*.p8 found. Set APNS_KEY_PATH or place key in RallyApp/."
  echo "Create one: Apple Developer → Keys → Apple Push Notifications service (APNs)."
  exit 1
fi

KEY_ID="${APNS_KEY_ID:-}"
if [[ -z "$KEY_ID" && "$P8_FILE" =~ AuthKey_([A-Z0-9]+)\.p8 ]]; then
  KEY_ID="${BASH_REMATCH[1]}"
fi
if [[ -z "$KEY_ID" ]]; then
  echo "ERROR: Could not infer Key ID. Set APNS_KEY_ID or rename file to AuthKey_XXXXXXXXXX.p8"
  exit 1
fi

TEAM_ID="${APPLE_TEAM_ID:-}"
if [[ -z "$TEAM_ID" ]]; then
  TEAM_ID="$(security find-identity -p codesigning -v 2>/dev/null \
    | grep -oE '\([A-Z0-9]{10}\)' | tr -d '()' | head -1 || true)"
fi
if [[ -z "$TEAM_ID" ]]; then
  echo "ERROR: Could not detect Apple Team ID. Set APPLE_TEAM_ID (10 chars, developer.apple.com → Membership)."
  exit 1
fi

echo "APNs key file : $P8_FILE"
echo "APNs Key ID   : $KEY_ID"
echo "Apple Team ID : $TEAM_ID"
echo "Firebase iOS  : $IOS_APP_ID"
echo

# --- Supabase push secret ---
if command -v supabase >/dev/null 2>&1; then
  if supabase secrets list --project-ref "$SUPABASE_REF" 2>/dev/null | grep -q FIREBASE_SERVER_KEY; then
    echo "Supabase      : FIREBASE_SERVER_KEY is set on $SUPABASE_REF"
  else
    echo "WARN Supabase : FIREBASE_SERVER_KEY missing on $SUPABASE_REF"
    echo "  Run: supabase secrets set FIREBASE_SERVER_KEY=\"...\" --project-ref $SUPABASE_REF"
  fi
else
  echo "WARN: supabase CLI not found — skip secret check"
fi
echo

# --- Firebase iOS app ---
if command -v firebase >/dev/null 2>&1; then
  firebase apps:list IOS --project "$PROJECT_ID" 2>/dev/null | grep -q "$IOS_APP_ID" \
    && echo "Firebase      : iOS app registered" \
    || echo "WARN Firebase : iOS app $IOS_APP_ID not found"
else
  echo "WARN: firebase CLI not found"
fi
echo

CONSOLE_URL="https://console.firebase.google.com/project/${PROJECT_ID}/settings/cloudmessaging/ios:${IOS_APP_ID}"
echo "Firebase has NO supported CLI to upload APNs .p8 keys (console only)."
echo
echo "Manual upload (one time):"
echo "  1. Open: $CONSOLE_URL"
echo "  2. Under APNs authentication key → Upload"
echo "  3. Select: $P8_FILE"
echo "  4. Key ID: $KEY_ID"
echo "  5. Team ID: $TEAM_ID"
echo "  6. Save"
echo

if [[ "${1:-}" == "--open" ]]; then
  if command -v open >/dev/null 2>&1; then
    open "$CONSOLE_URL"
    echo "Opened Firebase Cloud Messaging in your browser."
  else
    echo "Open the URL above in a browser."
  fi
else
  echo "Run: $0 --open   (opens Firebase Cloud Messaging settings)"
fi
