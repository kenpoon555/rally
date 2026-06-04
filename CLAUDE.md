# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install
cd ios && pod install && cd ..

# Run app
npm run ios
npm run android
npm start          # Metro bundler (separate terminal)

# Android manual build
npm run android:build-install

# Test
npm test

# Lint
npm run lint
```

Run a single test file: `npx jest path/to/test.tsx`

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (required)
- `GOOGLE_PLACES_API_KEY` or platform-specific variants (optional)
- `GEOFENCE_RADIUS`, `LOCATION_UPDATE_INTERVAL`, `LOCATION_DISTANCE_FILTER`

Environment variables are loaded via `react-native-config` and accessed through `src/constants/config.ts`.

## Architecture

### Stack
- **Backend**: Supabase (PostgreSQL + PostGIS + Auth + Realtime)
- **Navigation**: React Navigation — native-stack + bottom-tabs
- **Auth State**: React Context (`src/context/AuthContext.tsx`)
- **Push Notifications**: Firebase Messaging (lazy-loaded to avoid init crashes)
- **Location**: expo-location

### Navigation Structure (`src/navigation/AppNavigator.tsx`)
- **Auth Stack**: Login → Signup (unauthenticated users)
- **Main Stack**: Bottom tabs (Home/Map/Friends/Profile) + modal screens (ActivityDetail, CreateActivity, ChatList, ChatThread)

### Service Layer (`src/services/`)
All backend calls go through service modules — never call Supabase directly from components:
- `activityService.ts` — create/fetch/join activities, preferences, finalization
- `userService.ts` — user profile CRUD, device token registration
- `locationService.ts` — permissions, current position, background monitoring
- `chatService.ts` — threads, messages, unread counts
- `friendsService.ts` — friend requests, acceptance, listing
- `notificationService.ts` — Firebase push token registration, notification handlers
- `reviewService.ts` — post-match reviews

Supabase client is initialized in `src/services/api/supabase.ts` with a custom fetch to handle a trailing-slash URL bug and AsyncStorage session persistence.

### Custom Hooks (`src/hooks/`)
- `useAuth()` — consumes AuthContext
- `useLocation(autoStart, options)` — location fetching + watching
- `useActivities()` — fetch nearby activities
- `useGeofence()` — geofence detection
- `useSportsCatalog()` — **launch-enabled** sports for Discover/Create (`sports`); full list + metadata via `allSports` — see `src/constants/sports.ts` (`SPORT_METADATA`)

### Key Technical Decisions
- **Flexible Activity Mode**: Host sets broad time/location constraints; players submit preferences; system auto-finalizes optimal time/location
- **Anonymous-Until-Confirmed**: Participants see anonymized identity before confirmation, full identity after host approval
- **Platform Branching**: Significant iOS vs. Android differences in location (no `watchPosition` on Android) and notification flows (Android 13+ permissions)
- **Deep Link Auth**: Supabase magic links handled via `rallyapp://auth/callback`
- **Profile Auto-Create**: If auth succeeds but profile is missing, AuthContext auto-creates it from metadata/email

### Debug Infrastructure
The codebase has intentional remote telemetry logging (`src/utils/debugIngest.ts`) and a dev location log panel (`src/components/DevLocationLogPanel.tsx`) used for agent-assisted debugging. These are intentional, not dead code.

## Design & UI (Pencil MCP)
- **Visual Source of Truth**: When building new UI or fixing layouts, always use `pencil.get_canvas_context` to check the latest frames in the Pencil desktop app.
- **Component Mapping**: Map Pencil components to our existing library in `src/components/`. Do not create new base components if suitable ones exist.
- **Styling**: Prefer `StyleSheet.create` or Tailwind (whichever you use) over inline styles. Follow the spacing and color palette defined in `src/constants/theme.ts`.

## Agentic Development Rules
- **Error Handling**: Always wrap service calls in try-catch blocks using our `debugIngest` utility.
- **Performance**: Use `React.memo` for list items in `ActivityDetail` and `ChatList` to avoid re-render lag.
- **Safety**: Never hardcode Supabase keys. Ensure `src/constants/config.ts` is the only entry point for env vars.
- **Testing**: After every logic change in `src/services/`, run `npm test` automatically.

## Task Progress (Agent Use Only)
- **Actionable tasks:** Use `RallyApp/docs/TASKS.md` as the single task index. Pick **one** task per session to avoid rate limits; complete and check off before starting the next.
- Keep a `TODO.md` file updated in the root.
- At the end of every session, summarize what was finished and what the next bug-fix priority is.