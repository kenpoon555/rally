# Immediate Next Steps

## ✅ Completed
1. ✅ Supabase database setup (via MCP)
2. ✅ Google Places API keys added

## 🔄 Remaining Steps

### Step 3: Test Supabase Connection

**Goal**: Verify the app can connect to Supabase and basic operations work.

**Actions**:
1. **Build and run the app**
   ```bash
   cd RallyApp
   npm install
   cd ios && pod install && cd ..
   npm run ios  # or npm run android
   ```

2. **Test basic connection**:
   - App should launch without errors
   - Login screen should appear
   - Try to sign up with email/password
   - Check if user is created in Supabase dashboard

3. **Verify in Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to "Authentication" > "Users" - should see new user
   - Go to "Table Editor" > "users" - should see user profile

4. **Test database operations**:
   - Create an activity (if location detection works)
   - Check if activity appears in "activities" table
   - Verify RLS policies are working

**Expected Results**:
- ✅ App launches successfully
- ✅ Can sign up/login
- ✅ User appears in Supabase
- ✅ Can create activities (if location works)
- ✅ No connection errors in console

**If errors occur**:
- Check console logs for Supabase connection errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in config.ts
- Check Supabase project is active
- Verify RLS policies allow operations

---

### Step 4: Set Up Firebase for Push Notifications

**Goal**: Configure Firebase so push notifications work for location detection and activity updates.

#### 4.1 Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project" or select existing
3. Enter project name: `Rally App` (or your choice)
4. Enable Google Analytics (optional but recommended)
5. Click "Create project"

#### 4.2 iOS Setup (APNs)

1. **Add iOS app to Firebase**:
   - In Firebase Console, click "Add app" > iOS
   - Bundle ID: `org.reactjs.native.example.RallyApp` (or your actual bundle ID)
   - App nickname: `Rally iOS`
   - App Store ID: (optional, leave blank for now)
   - Click "Register app"

2. **Download GoogleService-Info.plist**:
   - Download the config file
   - Open Xcode: `cd RallyApp/ios && open RallyApp.xcworkspace`
   - Drag `GoogleService-Info.plist` into `RallyApp` folder in Xcode
   - Make sure "Copy items if needed" is checked
   - Make sure "RallyApp" target is selected

3. **Configure APNs**:
   - In Firebase Console, go to Project Settings > Cloud Messaging
   - Under "Apple app configuration", upload your APNs certificate or key
   - For development: Use APNs Authentication Key (recommended)
   - For production: Upload APNs certificate

#### 4.3 Android Setup (FCM)

1. **Add Android app to Firebase**:
   - In Firebase Console, click "Add app" > Android
   - Package name: `com.rallyapp`
   - App nickname: `Rally Android`
   - Debug signing certificate SHA-1: (get from `./gradlew signingReport`)
   - Click "Register app"

2. **Download google-services.json**:
   - Download the config file
   - Place it in `RallyApp/android/app/`

3. **Update Android build files**:
   - Already configured in `android/app/build.gradle` (should work automatically)
   - If needed, verify `apply plugin: 'com.google.gms.google-services'` is present

#### 4.4 Install Firebase Dependencies

Already installed:
- ✅ `@react-native-firebase/app`
- ✅ `@react-native-firebase/messaging`

#### 4.5 Test Push Notifications

1. **Run the app**:
   ```bash
   npm run ios  # or android
   ```

2. **Grant notification permission**:
   - App should request notification permission
   - Grant permission

3. **Verify device token registration**:
   - Sign up/login
   - Check Supabase `user_device_tokens` table
   - Should see device token registered

4. **Test notification**:
   - Can test manually via Firebase Console > Cloud Messaging > Send test message
   - Or trigger via location detection (when implemented)

**Expected Results**:
- ✅ Firebase project created
- ✅ iOS app configured with GoogleService-Info.plist
- ✅ Android app configured with google-services.json
- ✅ App requests notification permission
- ✅ Device token is registered in database
- ✅ Can receive test notifications

---

## Quick Test Checklist

### Supabase Connection Test
- [ ] App builds and runs
- [ ] Can sign up with email
- [ ] User appears in Supabase dashboard
- [ ] Can log in
- [ ] No connection errors

### Firebase Setup Test
- [ ] Firebase project created
- [ ] iOS: GoogleService-Info.plist added
- [ ] Android: google-services.json added
- [ ] Notification permission requested
- [ ] Device token registered in database
- [ ] Can receive test notification

---

## Troubleshooting

### Supabase Connection Issues
- **Error**: "Missing Supabase configuration"
  - Check `config.ts` has SUPABASE_URL and SUPABASE_ANON_KEY
- **Error**: "Invalid API key"
  - Verify keys are correct (no extra spaces)
  - Check Supabase project is active
- **Error**: "RLS policy violation"
  - Check RLS policies in Supabase dashboard
  - Verify user is authenticated

### Firebase Issues
- **iOS**: "GoogleService-Info.plist not found"
  - Make sure file is in Xcode project and added to target
- **Android**: "google-services.json not found"
  - Verify file is in `android/app/` directory
- **Notifications not working**:
  - Check notification permissions granted
  - Verify APNs/FCM certificates configured
  - Check device token is registered

---

## Next After These Steps

Once both are working:
1. Test location detection
2. Test activity creation
3. Test join request flow
4. Test friends system
5. Begin user testing
