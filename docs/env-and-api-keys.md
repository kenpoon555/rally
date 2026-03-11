# Environment variables and API keys

Use this to check what the app expects and where "API key not found" or similar errors come from.

## Where keys are used

| Key | Required? | Used for | If missing |
|-----|-----------|----------|------------|
| `SUPABASE_URL` | **Yes** | Auth, database, realtime | App throws at startup: "Missing Supabase configuration..." |
| `SUPABASE_ANON_KEY` | **Yes** | Same as above | Same as above |
| `GOOGLE_PLACES_API_KEY` or `GOOGLE_PLACES_API_KEY_ANDROID` / `GOOGLE_PLACES_API_KEY_IOS` | Optional (for Places search) | Search places in Create Activity, etc. | "Google Places API key is not configured" when you use place search |
| **Google Maps (Android)** | **Yes for Map tab** | Map tiles on Android (react-native-maps) | Map shows **"API key not found"** or blank map |
| Firebase | Not in `.env` | Push notifications | Uses `google-services.json` (Android) / `GoogleService-Info.plist` (iOS). App runs without it; notifications just won't work. |

## "API key not found" on Android Map

That message is from **Google Maps** (the map view), not from Supabase or Places. The map needs a key in the native Android config.

**If you already have `GOOGLE_PLACES_API_KEY_ANDROID` in `.env`** and still see the error:

1. **Enable Maps SDK for Android** on that key: [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Library** → search "Maps SDK for Android" → Enable. (Places API is separate; the map tile requires Maps SDK for Android.)
2. **Rebuild** the app so the key is baked into the native build: `cd android && ./gradlew clean && cd ..` then `npm run android` or `npm run android:build-install`. Changing `.env` or the manifest only takes effect after a rebuild.

**If the key is not set yet:**

1. In `.env` set `GOOGLE_PLACES_API_KEY_ANDROID=your_key` (or `GOOGLE_MAPS_API_KEY_ANDROID`).
2. Enable **Maps SDK for Android** and **Places API** for that key in Google Cloud Console.
3. Rebuild the Android app.

## How to check your setup

1. **Supabase**  
   - If the app fails immediately with "Missing Supabase configuration", add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env` and rebuild.

2. **Google Places**  
   - Try searching or picking a place in Create Activity. If you see "Google Places API key is not configured", add `GOOGLE_PLACES_API_KEY` or the platform-specific key to `.env` and rebuild.

3. **Google Maps (Android)**  
   - Open the Map tab. If you see "API key not found" or a blank/grey map, add `GOOGLE_PLACES_API_KEY_ANDROID` (or `GOOGLE_MAPS_API_KEY_ANDROID`) to `.env`, enable **Maps SDK for Android** for that key, and rebuild.

4. **Firebase**  
   - Not in `.env`. Configure via `google-services.json` (Android) and `GoogleService-Info.plist` (iOS). Optional for running the app; needed for push notifications.

## Example `.env`

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional but recommended for Map + place search (one key for both on Android)
GOOGLE_PLACES_API_KEY=your-google-api-key
# Or platform-specific:
# GOOGLE_PLACES_API_KEY_ANDROID=...
# GOOGLE_PLACES_API_KEY_IOS=...
```

After changing `.env`, rebuild the app (native config is read at build time).
