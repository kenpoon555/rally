# Rally App Setup Guide

## Prerequisites

1. Node.js >= 20
2. React Native development environment
3. iOS: Xcode and CocoaPods
4. Android: Android Studio

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. iOS Setup

```bash
cd ios && pod install && cd ..
```

### 3. Configure Environment Variables

Update `src/constants/config.ts` with your API keys:

```typescript
export const CONFIG = {
  SUPABASE_URL: 'your_supabase_url',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key',
  GOOGLE_PLACES_API_KEY: 'your_google_places_api_key',
  // ... rest of config
};
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and anon key from Settings > API

### 2. Run Database Migration

1. Go to SQL Editor in Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration

### 3. Enable PostGIS Extension

The migration includes PostGIS setup, but verify it's enabled:
- Go to Database > Extensions
- Ensure PostGIS is enabled

## Google Places API Setup

1. Go to Google Cloud Console
2. Create a project or select existing
3. Enable Places API
4. Create an API key
5. Add the key to your config

## Firebase Setup (for Push Notifications)

### iOS (APNs)

1. Create Firebase project at https://firebase.google.com
2. Add iOS app to Firebase project
3. Download `GoogleService-Info.plist`
4. Add it to `ios/RallyApp/` in Xcode
5. Configure APNs in Firebase Console

### Android (FCM)

1. Add Android app to Firebase project
2. Download `google-services.json`
3. Place it in `android/app/`
4. Update `android/build.gradle` and `android/app/build.gradle` as needed

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Testing

### Location Detection
- Grant location permissions when prompted
- The app will detect when you're near a sports location
- Activity confirmation modal will appear

### Activities
- Create activities through location detection or manually
- View nearby activities on Home and Map screens
- Request to join activities

### Friends
- Add friends by searching username/phone
- Accept/reject friend requests
- Filter activities by friends

## Troubleshooting

### Location Not Working
- Check location permissions in device settings
- Ensure background location is enabled (iOS: Settings > Privacy > Location Services)
- Verify Info.plist/AndroidManifest.xml permissions

### Supabase Connection Issues
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check Supabase project is active
- Verify RLS policies allow your operations

### Push Notifications Not Working
- Verify Firebase is configured correctly
- Check device token is registered in database
- Ensure APNs/FCM certificates are valid

## Next Steps

1. Set up your Supabase project and run migrations
2. Configure Google Places API
3. Set up Firebase for push notifications
4. Update config.ts with your API keys
5. Test the app on a real device (location features require real device)
