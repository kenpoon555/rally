#!/usr/bin/env bash
# Push Notifications is enabled on com.rallyapp (Apple Developer) and APNs key is in Firebase.
# EAS profiles must include Push — regenerate if an old build failed signing:
#   bash scripts/eas-regenerate-ios-push-profiles.sh
#
# Previously this script cleared aps-environment when provisioning profiles were stale (PR #20).
# That is disabled now that Push is on the App ID.
set -euo pipefail

if [[ "${EAS_BUILD_PLATFORM:-}" == "ios" ]]; then
  echo "eas-ios-push-entitlements: keeping push entitlements (aps-environment) for ${EAS_BUILD_PROFILE:-unknown} build"
fi
