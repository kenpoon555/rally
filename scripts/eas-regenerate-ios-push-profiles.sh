#!/usr/bin/env bash
# Regenerate iOS provisioning profiles after enabling Push Notifications.
# Run locally (requires Apple Developer login via EAS CLI).
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Rally iOS push credential fix ==="
echo ""
echo "1. Apple Developer → Identifiers → com.rallyapp"
echo "   Enable Push Notifications → Save → Confirm"
echo ""
echo "2. Regenerate EAS provisioning profiles (log in when prompted):"
echo ""

for profile in preview production; do
  echo "--- Profile: ${profile} ---"
  npx eas-cli credentials:configure-build -p ios -e "$profile"
  echo ""
done

echo "3. After profiles regenerate, edit scripts/eas-ios-push-entitlements.sh"
echo "   Remove 'production' from STRIP_PROFILES so push entitlements ship again."
echo ""
echo "4. Re-run production deploy (merge to production or workflow_dispatch)."
