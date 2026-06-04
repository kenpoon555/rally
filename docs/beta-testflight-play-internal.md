# Beta distribution — TestFlight + Google Play internal testing

Last updated: 2026-05-06

Prerequisites: EAS production/preview builds configured ([eas-build-and-credentials.md](eas-build-and-credentials.md)); crash reporting optional via `SENTRY_DSN` in `.env` / EAS secrets ([../.env.example](../.env.example)).

## Smoke matrix (before inviting testers)

Run `./scripts/verify-release-bundle.sh`, then on **one physical iOS** and **one physical Android** device:

| # | Flow |
| --- | --- |
| 1 | Cold start → login |
| 2 | Discover loads without crash |
| 3 | Open Map tab |
| 4 | Create activity (minimal fields) → appears on Discover |
| 5 | Logout |

Document failures in `docs/phase-3-validation-results.md` or a short beta notes file.

## iOS — TestFlight

1. Register App ID and App Store Connect app for bundle `com.rallyapp` (if not done).
2. `cd RallyApp && npx eas-cli build --platform ios --profile production` (or `preview` for internal-only).
3. `npx eas-cli submit --platform ios --latest` (or upload `.ipa` via Transporter).
4. App Store Connect → TestFlight → add **Internal** then **External** testers; submit **Beta App Review** if using external.

## Android — Internal / open testing

1. Create app in Google Play Console with package `com.rallyapp`.
2. `npx eas-cli build --platform android --profile production`.
3. `npx eas-cli submit --platform android --latest` or upload AAB manually to **Internal testing** track.
4. Add tester emails; promote to **Open testing** when ready.

## Sentry (optional but recommended for beta)

1. Create a Sentry React Native project; copy DSN.
2. `eas secret:create --scope project --name SENTRY_DSN --value "https://..."` (and mirror in local `.env` for dev builds that use react-native-config).
3. Rebuild client so `App.tsx` initializes Sentry when `SENTRY_DSN` is set.
