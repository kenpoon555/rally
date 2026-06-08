#!/usr/bin/env bash
# EAS iOS profiles on Expo may predate Push Notifications on com.rallyapp.
# Xcode fails when entitlements declare aps-environment but the AdHoc/AppStore
# profile does not include Push. Clear entitlements on cloud builds so CI succeeds.
#
# To restore iOS push: enable Push on the App ID in Apple Developer, regenerate
# profiles (scripts/eas-regenerate-ios-push-profiles.sh), then remove production
# from STRIP_PROFILES below.
set -euo pipefail

if [[ "${EAS_BUILD_PLATFORM:-}" != "ios" ]]; then
  exit 0
fi

PROFILE="${EAS_BUILD_PROFILE:-${APP_ENV:-}}"
STRIP_PROFILES="preview production"

should_strip=false
for allowed in $STRIP_PROFILES; do
  if [[ "$PROFILE" == "$allowed" ]]; then
    should_strip=true
    break
  fi
done

if [[ "$should_strip" != true ]]; then
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
    echo "eas-ios-push-entitlements: cleared push entitlements in ${file} (${PROFILE} build)"
  fi
done
