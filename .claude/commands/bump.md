Bump the app version and build number in app.json, then commit and push to dev.

## Input

The user may pass a bump type as an argument: `patch`, `minor`, or `major`. Default to `patch` if not specified.

## Steps

1. Read the current values from app.json:
   - `expo.version` (semver string like "1.0.0")
   - `expo.ios.buildNumber` (string like "19")
   - `expo.android.versionCode` (number like 19)

2. Compute the new values:
   - Bump `expo.version` according to the bump type (patch/minor/major)
   - Increment `expo.ios.buildNumber` by 1 (as a string)
   - Increment `expo.android.versionCode` by 1 (as a number)

3. Write the updated values back to app.json using the Edit tool.

4. Run: `git add app.json && git commit -m "chore: bump to <NEW_VERSION> (build <NEW_BUILD>)" && git push origin dev`

5. Report: "Bumped to <NEW_VERSION> (build <NEW_BUILD>) and pushed to dev."

## Notes

- Always push to dev — the version flows through dev → preview → main → production normally.
- Do NOT bump if there are unstaged changes in app.json (warn the user instead).
- EAS reads buildNumber directly from app.json (appVersionSource: local, no autoIncrement) — whatever is committed is what gets built.
