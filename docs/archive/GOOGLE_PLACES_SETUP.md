# Google Places API Setup Guide

## Step-by-Step Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"New Project"**
5. Enter project name: `Rally App` (or your preferred name)
6. Click **"Create"**
7. Wait for project creation, then select it from the dropdown

### Step 2: Enable Places API

1. In the Google Cloud Console, go to **"APIs & Services" > "Library"**
2. Search for **"Places API"**
3. Click on **"Places API"** (make sure it's the one by Google)
4. Click **"Enable"**
5. Wait for it to enable (usually takes a few seconds)

**Note**: You may also want to enable:
- **Places API (New)** - for newer features
- **Geocoding API** - if you need address conversion
- **Maps JavaScript API** - if you add web features later

### Step 3: Create API Keys

#### Option A: Single Key for Both Platforms (Simpler for MVP)

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Copy the key immediately (you can't see it again)
5. Click **"Restrict key"** to add security

#### Option B: Separate Keys for iOS and Android (Recommended)

**For iOS Key:**
1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ CREATE CREDENTIALS" > "API key"**
3. Name it: `Rally iOS` (click the pencil icon to rename)
4. Click **"Restrict key"**
5. Under **"Application restrictions"**:
   - Select **"iOS apps"**
   - Click **"Add an item"**
   - Enter your bundle ID: `com.rallyapp` (or your actual bundle ID)
6. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Places API"** (and "Places API (New)" if enabled)
7. Click **"Save"**
8. Copy the key

**For Android Key:**
1. Click **"+ CREATE CREDENTIALS" > "API key"** again
2. Name it: `Rally Android`
3. Click **"Restrict key"**
4. Under **"Application restrictions"**:
   - Select **"Android apps"**
   - Click **"Add an item"**
   - Enter package name: `com.rallyapp` (or your actual package name)
   - Enter SHA-1 certificate fingerprint (see below for how to get this)
5. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check **"Places API"** (and "Places API (New)" if enabled)
6. Click **"Save"**
7. Copy the key

### Step 4: Get Android SHA-1 Fingerprint

#### For Debug Build:
```bash
cd android
./gradlew signingReport
```

Look for the SHA-1 under `Variant: debug` > `Config: debug`

Or use keytool:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### For Release Build:
```bash
keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias
```

**Important**: Add both debug and release SHA-1 fingerprints to your Android API key restrictions.

### Step 5: Set Up Billing (Required)

Google Places API requires billing to be enabled (but has a free tier):

1. Go to **"Billing"** in the left menu
2. Click **"Link a billing account"**
3. Follow the prompts to add a payment method
4. **Free tier**: $200 credit per month, which covers:
   - ~40,000 Place Details requests
   - ~20,000 Place Search requests

**Note**: You won't be charged unless you exceed the free tier.

### Step 6: Set Usage Quotas (Optional but Recommended)

1. Go to **"APIs & Services" > "Quotas"**
2. Search for **"Places API"**
3. Click on the API
4. Set daily quotas to prevent unexpected charges:
   - **Places API - Text Search**: Set to a reasonable limit (e.g., 10,000/day)
   - **Places API - Place Details**: Set to a reasonable limit (e.g., 10,000/day)

### Step 7: Add Keys to Your App

1. Open `src/constants/config.ts`
2. Add your keys:

**If using separate keys (recommended):**
```typescript
GOOGLE_PLACES_API_KEY_IOS: 'your_ios_api_key_here',
GOOGLE_PLACES_API_KEY_ANDROID: 'your_android_api_key_here',
```

**If using single key:**
```typescript
GOOGLE_PLACES_API_KEY: 'your_api_key_here',
```

### Step 8: Verify Your Bundle ID / Package Name

Make sure the bundle ID/package name in your API key restrictions matches your app:

**iOS Bundle ID:**
- Your bundle ID: `org.reactjs.native.example.RallyApp`
- You can change this in Xcode if needed (recommended: `com.rallyapp`)

**Android Package Name:**
- Your package name: `com.rallyapp`
- Located in `android/app/build.gradle` as `applicationId`

**To change iOS bundle ID (optional but recommended):**
1. Open `ios/RallyApp.xcodeproj` in Xcode
2. Select the project in the navigator
3. Select the "RallyApp" target
4. Go to "General" tab
5. Change "Bundle Identifier" to `com.rallyapp` (to match Android)

### Step 9: Test the Setup

1. Run your app: `npm run ios` or `npm run android`
2. Try searching for a location
3. Check Google Cloud Console > "APIs & Services" > "Dashboard" to see if requests are coming through

## Troubleshooting

### "This API key is not authorized"
- Check that Places API is enabled
- Verify API key restrictions allow your app
- For Android: Make sure SHA-1 fingerprint is correct

### "API key not valid"
- Verify you copied the key correctly
- Check that the key hasn't been deleted
- Make sure billing is enabled

### "Request denied"
- Check API restrictions - make sure Places API is allowed
- Verify application restrictions match your bundle ID/package name

### "Quota exceeded"
- Check your usage in Google Cloud Console
- Increase quotas if needed
- Review your app for excessive API calls

## Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Places API
- [ ] Created API key(s)
- [ ] Added application restrictions (bundle ID/package name)
- [ ] Added API restrictions (Places API only)
- [ ] Got SHA-1 fingerprint for Android (if using Android key)
- [ ] Set up billing account
- [ ] Set usage quotas (optional)
- [ ] Added keys to `config.ts`
- [ ] Tested the app

## Cost Estimation

For MVP usage (assuming ~100 active users):
- Place Search: ~1,000 requests/day = ~$0.03/day
- Place Details: ~500 requests/day = ~$0.01/day
- **Total: ~$1.20/month** (well within free tier)

## Next Steps

After setup:
1. Monitor usage in Google Cloud Console
2. Set up alerts for unusual usage
3. Consider migrating to backend proxy for production (see `SECURITY.md`)
