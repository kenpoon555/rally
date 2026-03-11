# Security Best Practices for API Keys

## ⚠️ Important Security Warning

**Storing API keys in source code is NOT secure for production!**

API keys in your React Native app bundle can be extracted by anyone who:
- Downloads your app
- Uses reverse engineering tools
- Inspects the app bundle

## Google Places API Key Security

### Option 1: API Key Restrictions (Recommended for MVP)

1. **Create separate keys for iOS and Android** in Google Cloud Console
2. **Apply restrictions:**
   - **Application restrictions**: 
     - iOS: Restrict by bundle ID (e.g., `com.rallyapp`)
     - Android: Restrict by package name and SHA-1 certificate fingerprint
   - **API restrictions**: Only allow "Places API"
3. **Set usage quotas** to limit abuse

**Steps:**
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create API key
3. Click "Restrict key"
4. Under "Application restrictions":
   - iOS: Select "iOS apps" and add your bundle ID
   - Android: Select "Android apps" and add package name + SHA-1
5. Under "API restrictions": Select "Restrict key" and choose "Places API"

### Option 2: Backend Proxy (Recommended for Production)

**Best practice**: Proxy all Google Places API requests through your backend.

**Benefits:**
- API key never exposed to client
- Can add rate limiting
- Can add caching
- Can add authentication
- Can add request validation

**Implementation:**
1. Create a Supabase Edge Function or backend endpoint
2. Client calls your endpoint instead of Google directly
3. Backend makes the Google Places API call
4. Backend returns the result

Example Edge Function:
```typescript
// supabase/functions/google-places/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { query, location, sportType } = await req.json()
  
  // Validate request, check auth, etc.
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${Deno.env.get('GOOGLE_PLACES_API_KEY')}`
  )
  
  return new Response(JSON.stringify(await response.json()))
})
```

### Option 3: Environment Variables (Better than hardcoding)

Use `react-native-config` to load keys from `.env` file:

1. Install: `npm install react-native-config`
2. Create `.env` file (add to `.gitignore`)
3. Load in config: `GOOGLE_PLACES_API_KEY: Config.GOOGLE_PLACES_API_KEY`

**Note**: This still exposes keys in the bundle, but keeps them out of source control.

## Supabase Keys

**Supabase anon key is safe to expose** - it's designed to be public. Security is handled by:
- Row Level Security (RLS) policies
- Service role key (never expose this!)
- Database-level permissions

## Current Setup

For MVP/development, using API key restrictions is acceptable:
- ✅ Separate keys for iOS/Android
- ✅ Application restrictions (bundle ID/package name)
- ✅ API restrictions (Places API only)
- ✅ Usage quotas

For production, migrate to backend proxy:
- ✅ API key never in client
- ✅ Full control over requests
- ✅ Better security and monitoring

## Monitoring

1. **Monitor API usage** in Google Cloud Console
2. **Set up alerts** for unusual usage patterns
3. **Rotate keys** if compromised
4. **Review access logs** regularly

## Checklist

- [ ] Create separate API keys for iOS and Android
- [ ] Apply application restrictions (bundle ID/package name)
- [ ] Apply API restrictions (Places API only)
- [ ] Set usage quotas
- [ ] Add keys to config (with platform-specific support)
- [ ] Test on both platforms
- [ ] Monitor usage in Google Cloud Console
- [ ] Plan migration to backend proxy for production
