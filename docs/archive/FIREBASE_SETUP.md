# Firebase Setup Guide for Push Notifications

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Project name: `Rally App`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: iOS Setup

### 2.1 Add iOS App

1. In Firebase Console, click "Add app" > iOS icon
2. **Bundle ID**: `org.reactjs.native.example.RallyApp`
   - To find your actual bundle ID: Open `ios/RallyApp.xcodeproj` in Xcode, check "General" tab
3. **App nickname**: `Rally iOS`
4. **App Store ID**: Leave blank for now
5. Click "Register app"

### 2.2 Download GoogleService-Info.plist

1. Download the `GoogleService-Info.plist` file
2. **Add to Xcode**:
   ```bash
   cd RallyApp/ios
   open RallyApp.xcworkspace
   ```
3. In Xcode:
   - Right-click on `RallyApp` folder (blue icon)
   - Select "Add Files to RallyApp..."
   - Select `GoogleService-Info.plist`
   - ✅ Check "Copy items if needed"
   - ✅ Check "RallyApp" target
   - Click "Add"

### 2.3 Configure APNs (Apple Push Notification Service)

**Option A: APNs Authentication Key (Recommended)**

1. Go to https://developer.apple.com/account/resources/authkeys/list
2. Click "+" to create new key
3. Name: `Rally APNs Key`
4. Enable "Apple Push Notifications service (APNs)"
5. Click "Continue" > "Register"
6. Download the `.p8` key file (you can only download once!)
7. Note the Key ID
8. In Firebase Console:
   - Go to Project Settings > Cloud Messaging
   - Under "Apple app configuration"
   - Click "Upload" next to "APNs Authentication Key"
   - Upload the `.p8` file
   - Enter Key ID
   - Enter Team ID (found in Apple Developer account)

**Option B: APNs Certificate (Alternative)**

1. Create APNs certificate in Apple Developer portal
2. Upload to Firebase Console > Cloud Messaging > APNs Certificates

## Step 3: Android Setup

### 3.1 Add Android App

1. In Firebase Console, click "Add app" > Android icon
2. **Package name**: `com.rallyapp`
3. **App nickname**: `Rally Android`
4. **Debug signing certificate SHA-1**: 
   - Get it by running:
     ```bash
     cd RallyApp/android
     ./gradlew signingReport
     ```
   - Look for SHA-1 under `Variant: debug` > `Config: debug`
   - Copy the SHA-1 (format: `XX:XX:XX:...`)
5. Click "Register app"

### 3.2 Download google-services.json

1. Download the `google-services.json` file
2. Place it in:
   ```
   RallyApp/android/app/google-services.json
   ```

### 3.3 Update Android Build Files

**Update `android/build.gradle`**:

Add Google Services plugin to classpath:

```gradle
buildscript {
    dependencies {
        classpath("com.android.tools.build:gradle")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
        classpath("com.google.gms:google-services:4.4.0")  // Add this line
    }
}
```

**Update `android/app/build.gradle`**:

Add at the bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services'
```

## Step 4: Verify Installation

### iOS
1. Check `GoogleService-Info.plist` is in Xcode project
2. Verify it's added to "RallyApp" target
3. Build: `npm run ios`

### Android
1. Check `google-services.json` is in `android/app/`
2. Verify build.gradle files are updated
3. Build: `npm run android`

## Step 5: Test Push Notifications

### 5.1 Run the App

```bash
npm run ios  # or npm run android
```

### 5.2 Grant Notification Permission

- App should request notification permission
- Grant permission when prompted

### 5.3 Verify Device Token Registration

1. Sign up/login in the app
2. Check Supabase dashboard:
   - Go to Table Editor > `user_device_tokens`
   - Should see a row with your device token

### 5.4 Send Test Notification

**Via Firebase Console**:
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Click "Send test message"
5. Enter your device's FCM token (from `user_device_tokens` table)
6. Click "Test"

**Expected**: Notification should appear on device

## Troubleshooting

### iOS Issues

**"GoogleService-Info.plist not found"**
- Make sure file is in Xcode project (not just in folder)
- Verify it's added to "RallyApp" target
- Clean build: In Xcode, Product > Clean Build Folder

**"APNs not configured"**
- Upload APNs key/certificate in Firebase Console
- Verify Team ID and Key ID are correct

### Android Issues

**"google-services.json not found"**
- Verify file is in `android/app/` directory
- Check file name is exactly `google-services.json`

**Build error: "Plugin with id 'com.google.gms.google-services' not found"**
- Make sure you added the classpath in `android/build.gradle`
- Sync Gradle files in Android Studio

**"Default FirebaseApp is not initialized"**
- Check `google-services.json` is correct
- Verify package name matches: `com.rallyapp`
- Clean and rebuild: `cd android && ./gradlew clean`

### Notification Issues

**Notifications not received**:
- Check notification permission is granted
- Verify device token is registered in database
- Check Firebase Console > Cloud Messaging for delivery status
- For iOS: Verify APNs is configured correctly
- For Android: Check FCM is enabled in Firebase Console

## Success Checklist

- [ ] Firebase project created
- [ ] iOS app added with GoogleService-Info.plist
- [ ] Android app added with google-services.json
- [ ] APNs configured (iOS)
- [ ] Android build.gradle updated
- [ ] App builds successfully
- [ ] Notification permission granted
- [ ] Device token registered in database
- [ ] Test notification received

Once all checked, push notifications are ready! 🎉
