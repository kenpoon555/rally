Bump the app version and build number, then commit and push to dev.

## Input

The user may pass a bump type as an argument: `patch`, `minor`, or `major`. Default to `patch` if not specified.

## Steps

1. Read the current values from `app.json`:
   - `expo.version` (semver string like "1.0.0")
   - `expo.ios.buildNumber` (string like "19")
   - `expo.android.versionCode` (number like 19)

2. Compute new values:
   - Bump `expo.version` by the bump type (patch/minor/major semver rules)
   - `NEW_BUILD = current buildNumber + 1`

3. Update `app.json`: set `expo.version`, `expo.ios.buildNumber` (as string), `expo.android.versionCode` (as number).

4. Update `ios/RallyApp/Info.plist`:
   - Set `CFBundleShortVersionString` to the new version
   - Set `CFBundleVersion` to the new build number (as string)
   - This is the file EAS actually reads — app.json is ignored when a native ios/ directory exists.

5. Run: `git add app.json ios/RallyApp/Info.plist && git commit -m "chore: bump to <NEW_VERSION> (build <NEW_BUILD>)" && git push origin dev`

6. Report: "Bumped to <NEW_VERSION> (build <NEW_BUILD>) and pushed to dev."

## Notes

- Always update BOTH `app.json` AND `ios/RallyApp/Info.plist` — EAS reads from the native plist when ios/ exists.
- Always push to dev. Version flows through dev → preview → main → production.
- Do NOT bump if there are unstaged changes in app.json or Info.plist (warn the user instead).
