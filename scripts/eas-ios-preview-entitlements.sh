#!/usr/bin/env bash
# Preview iOS uses an AdHoc profile that may not include Push Notifications.
# Production builds keep aps-environment in ios/RallyApp/*Release*.entitlements.
set -euo pipefail

if [[ "${EAS_BUILD_PLATFORM:-}" != "ios" ]]; then
  exit 0
fi

if [[ "${EAS_BUILD_PROFILE:-}" != "preview" && "${APP_ENV:-}" != "preview" ]]; then
  exit 0
fi

EMPTY_ENTITLEMENTS='<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict/>
</plist>'

for file in ios/RallyApp/RallyApp.entitlements ios/RallyApp/RallyAppRelease.entitlements; do
  if [[ -f "$file" ]]; then
    printf '%s\n' "$EMPTY_ENTITLEMENTS" >"$file"
    echo "eas-ios-preview-entitlements: cleared push entitlements in ${file} for preview build"
  fi
done
