# Quick Google Places API Setup

## Your App Identifiers

- **Android Package Name**: `com.rallyapp`
- **iOS Bundle ID**: `org.reactjs.native.example.RallyApp` (consider changing to `com.rallyapp`)

## 5-Minute Setup

### 1. Create API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable **Places API**
4. Go to **Credentials** > **Create Credentials** > **API key**

### 2. Restrict the Key (Important!)
1. Click **"Restrict key"**
2. **Application restrictions**:
   - **iOS**: Select "iOS apps", add bundle ID: `org.reactjs.native.example.RallyApp`
   - **Android**: Select "Android apps", add package: `com.rallyapp`, add SHA-1 (see below)
3. **API restrictions**: Select "Restrict key", check "Places API"
4. **Save**

### 3. Get Android SHA-1
```bash
cd RallyApp/android
./gradlew signingReport
```
Look for SHA-1 under `Variant: debug` > `Config: debug`

### 4. Enable Billing
- Go to **Billing** in Google Cloud Console
- Add payment method (required, but free tier covers MVP usage)

### 5. Add Key to App
Edit `src/constants/config.ts`:
```typescript
GOOGLE_PLACES_API_KEY: 'your_api_key_here',
```

Or for separate keys:
```typescript
GOOGLE_PLACES_API_KEY_IOS: 'your_ios_key',
GOOGLE_PLACES_API_KEY_ANDROID: 'your_android_key',
```

## That's It! 🎉

See `GOOGLE_PLACES_SETUP.md` for detailed instructions.
