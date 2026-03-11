# Rally App - Sports Social MVP

A location-aware sports social app that helps people spontaneously or intentionally play sports together.

## Features (MVP)

- Location detection at sports venues
- Activity confirmation and creation
- Join request system
- Friends system (lightweight)
- Real-time activity updates
- Push notifications

## Setup

### Prerequisites

- Node.js >= 20
- React Native development environment
- iOS: Xcode and CocoaPods
- Android: Android Studio

### Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install CocoaPods:
```bash
cd ios && pod install && cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Supabase and Google Places API keys
```

Required `.env` keys:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Optional `GOOGLE_PLACES_API_KEY` or platform-specific keys:
  - `GOOGLE_PLACES_API_KEY_IOS`
  - `GOOGLE_PLACES_API_KEY_ANDROID`

### Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the main migration in Supabase SQL Editor:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Run the migration

3. Get your Supabase URL and anon key from Project Settings > API
4. Add them to your `.env` file

If `001_initial_schema.sql` fails due to extension issues, run `supabase/migrations/000_users_only.sql` as a minimal fallback so auth + profile creation can still work.

### Auth + Profiles Setup Notes

- App user profile data is stored in the `profiles` table (not a `users` table).
- The `profiles.id` value must match `auth.users.id` (UUID).
- On authenticated session load, app attempts to fetch profile from `profiles`; if missing, it auto-creates one using auth metadata/fallback username.
- Required policy for initial profile create is already in migrations:
  - `Users can insert own profile` with `WITH CHECK (auth.uid() = id)`.
- Deep-link callback used for auth is `rallyapp://auth/callback`.

Quick verification query after signup/login:

```sql
select id, username, email, phone, created_at
from profiles
order by created_at desc
limit 10;
```

### Google Places API Setup

1. Create a project in Google Cloud Console
2. Enable Places API
3. Create an API key
4. Add the key to your `.env` file

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

If you see **"Failed to install on any devices"** with "Unknown API Level" or "Could not find build of variant ... arm64-v8a" (common on API 35 AVDs or after ADB timeouts), build and install manually:

```bash
npm run android:build-install
```

Then start Metro in another terminal (`npm start`) and open the app on the device. Ensure the emulator is running and `adb devices` shows the device before running the script.

### Push Notifications Setup

- Follow `docs/phase-4-notifications-validation-checklist.md` to complete Firebase/APNs setup and verify token + delivery behavior.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── containers/       # Container components with logic
├── pages/           # Screen components
├── services/        # API and business logic
├── hooks/           # Custom React hooks
├── context/         # React Context providers
├── types/           # TypeScript types
├── utils/           # Utility functions
├── constants/       # App constants
└── navigation/      # Navigation setup
```

## Tech Stack

- React Native 0.83+
- TypeScript
- Supabase (PostgreSQL with PostGIS)
- React Navigation
- React Native Maps
- React Native Geolocation Service
- React Native Firebase

## Development

This project follows the agent-based architecture defined in `.agents/` directory. Each agent handles specific domain responsibilities.

## Documentation Notes

- Active product docs are kept at top level: `ROADMAP.md`, `VISION.md`, and this `README.md`.
- Older setup and troubleshooting docs are archived in `docs/archive/`.
- Auth test checklist: `docs/archive/auth-profile-validation-checklist.md` (archived; revisit if needed).
- Phase 3 validation checklist: `docs/phase-3-partner-matching-validation-checklist.md`.
- Phase 4 notification checklist: `docs/phase-4-notifications-validation-checklist.md`.
- Release readiness checklist: `docs/release-readiness-checklist.md`.
- V2-V4 backlog: `docs/v2-v4-implementation-backlog.md`.

## License

Private project
# rally
